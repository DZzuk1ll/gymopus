import structlog
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, async_session
from app.api.deps import get_current_user, get_llm_config, LLMConfig
from app.api.rate_limit import check_rate_limit, increment_rate_limit
from app.models.user import User
from app.schemas import ApiResponse
from app.agents.context_agent import context_agent, AnalysisResult
from app.agents.deps import AgentDeps, create_model

logger = structlog.get_logger()

router = APIRouter(prefix="/insights", tags=["insights"])


def _serialize_profile(user: User) -> dict:
    return {
        "id": str(user.id),
        "gender": user.gender,
        "age": user.age,
        "height_cm": user.height_cm,
        "weight_kg": user.weight_kg,
        "training_goal": user.training_goal,
        "training_experience_years": user.training_experience_years,
        "training_frequency_per_week": user.training_frequency_per_week,
        "session_duration_minutes": user.session_duration_minutes,
        "available_equipment": user.available_equipment,
        "injuries": user.injuries,
    }


@router.post("/analyze")
async def analyze_user_data(
    user: User = Depends(get_current_user),
    llm_config: LLMConfig = Depends(get_llm_config),
    db: AsyncSession = Depends(get_db),
    _rate_limit: None = Depends(check_rate_limit),
) -> ApiResponse[dict]:
    model = create_model(llm_config)
    deps = AgentDeps(
        session_factory=async_session,
        user_profile=_serialize_profile(user),
    )

    prompt = (
        "请综合分析用户近期的训练、饮食和身体状态数据。"
        "先获取所有相关数据，然后给出全面的分析和建议。"
    )

    try:
        result = await context_agent.run(prompt, model=model, deps=deps)
        output = result.output
        await increment_rate_limit(user.id, llm_config, db)
        return ApiResponse.ok(output.model_dump())
    except Exception as e:
        logger.error("insights_analysis_failed", error=str(e))
        return ApiResponse.fail(f"数据分析失败：{str(e)}")
