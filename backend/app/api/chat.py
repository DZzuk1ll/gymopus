import asyncio
import json

import structlog
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_current_user, get_llm_config, LLMConfig
from app.api.rate_limit import check_rate_limit, increment_rate_limit
from app.models.user import User
from app.schemas import ApiResponse
from app.schemas.chat import ChatRequest, ChatResponse
from app.graph.workflow import graph

logger = structlog.get_logger()

CHAT_TIMEOUT_SECONDS = 60

router = APIRouter(prefix="/chat", tags=["chat"])


def _serialize_user_profile(user: User) -> dict:
    return {
        "id": str(user.id),
        "gender": user.gender,
        "age": user.age,
        "height_cm": user.height_cm,
        "weight_kg": user.weight_kg,
        "body_fat_pct": user.body_fat_pct,
        "training_goal": user.training_goal,
        "training_experience_years": user.training_experience_years,
        "training_frequency_per_week": user.training_frequency_per_week,
        "session_duration_minutes": user.session_duration_minutes,
        "available_equipment": user.available_equipment or [],
        "injuries": user.injuries or [],
    }


@router.post("")
async def chat(
    body: ChatRequest,
    user: User = Depends(get_current_user),
    llm_config: LLMConfig = Depends(get_llm_config),
    db: AsyncSession = Depends(get_db),
    _rate_limit: None = Depends(check_rate_limit),
) -> ApiResponse[ChatResponse]:
    initial_state = {
        "messages": [HumanMessage(content=body.message)],
        "user_id": str(user.id),
        "user_profile": _serialize_user_profile(user),
        "intent": "",
        "workout_plan": None,
        "meal_plan": None,
        "diet_analysis": None,
        "qa_answer": None,
        "validation_result": None,
        "retry_count": 0,
        "response": "",
        "llm_config": llm_config.model_dump(),
    }

    config = {"configurable": {"thread_id": str(user.id)}}

    try:
        result = await asyncio.wait_for(
            graph.ainvoke(initial_state, config=config),
            timeout=CHAT_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        logger.error("graph_invocation_timeout", user_id=str(user.id))
        return ApiResponse.fail("请求处理超时，请稍后重试或简化你的问题")
    except Exception as e:
        error_msg = str(e)
        logger.error("graph_invocation_failed", error=error_msg)
        if "rate" in error_msg.lower() or "429" in error_msg:
            return ApiResponse.fail("AI 服务请求频率超限，请稍后再试")
        if "auth" in error_msg.lower() or "401" in error_msg or "api_key" in error_msg.lower():
            return ApiResponse.fail("AI 服务认证失败，请检查你的 API Key 设置")
        return ApiResponse.fail(f"处理请求时出错，请稍后重试")

    # Increment rate limit after successful LLM call
    await increment_rate_limit(user.id, llm_config, db)

    return ApiResponse.ok(
        ChatResponse(
            response=result.get("response", ""),
            intent=result.get("intent", ""),
            workout_plan=result.get("workout_plan"),
            meal_plan=result.get("meal_plan"),
            diet_analysis=result.get("diet_analysis"),
        )
    )


@router.post("/stream")
async def chat_stream(
    body: ChatRequest,
    user: User = Depends(get_current_user),
    llm_config: LLMConfig = Depends(get_llm_config),
    db: AsyncSession = Depends(get_db),
    _rate_limit: None = Depends(check_rate_limit),
):
    """SSE streaming endpoint using LangGraph astream_events."""
    initial_state = {
        "messages": [HumanMessage(content=body.message)],
        "user_id": str(user.id),
        "user_profile": _serialize_user_profile(user),
        "intent": "",
        "workout_plan": None,
        "meal_plan": None,
        "diet_analysis": None,
        "qa_answer": None,
        "validation_result": None,
        "retry_count": 0,
        "response": "",
        "llm_config": llm_config.model_dump(),
    }

    config = {"configurable": {"thread_id": str(user.id)}}

    async def event_generator():
        try:
            async for event in graph.astream_events(
                initial_state, config=config, version="v2"
            ):
                kind = event.get("event", "")

                if kind == "on_chat_model_stream":
                    chunk = event.get("data", {}).get("chunk")
                    if chunk and hasattr(chunk, "content") and chunk.content:
                        yield f"data: {json.dumps({'type': 'token', 'content': chunk.content}, ensure_ascii=False)}\n\n"

                elif kind == "on_chain_end" and event.get("name") == "LangGraph":
                    output = event.get("data", {}).get("output", {})
                    final_data = {
                        "type": "final",
                        "response": output.get("response", ""),
                        "intent": output.get("intent", ""),
                        "workout_plan": output.get("workout_plan"),
                        "meal_plan": output.get("meal_plan"),
                        "diet_analysis": output.get("diet_analysis"),
                    }
                    yield f"data: {json.dumps(final_data, ensure_ascii=False)}\n\n"

            await increment_rate_limit(user.id, llm_config, db)
            yield "data: [DONE]\n\n"

        except Exception as e:
            logger.error("stream_failed", error=str(e))
            error_data = {"type": "error", "message": "处理请求时出错，请稍后重试"}
            yield f"data: {json.dumps(error_data, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
