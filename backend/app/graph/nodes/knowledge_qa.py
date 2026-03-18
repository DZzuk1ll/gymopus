import structlog
from langchain_core.messages import HumanMessage, AIMessage

from app.graph.state import GymOpusState
from app.agents.qa_agent import qa_agent
from app.agents.deps import AgentDeps, create_model
from app.api.deps import LLMConfig
from app.database import async_session

logger = structlog.get_logger()


async def knowledge_qa(state: GymOpusState) -> dict:
    messages = state["messages"]
    user_message = ""
    for msg in reversed(messages):
        if isinstance(msg, HumanMessage) or (
            isinstance(msg, dict) and msg.get("role") == "user"
        ):
            user_message = msg.content if hasattr(msg, "content") else msg.get("content", "")
            break

    llm_config = LLMConfig(**state["llm_config"])
    model = create_model(llm_config)

    deps = AgentDeps(
        session_factory=async_session,
        user_profile=state.get("user_profile", {}),
    )

    try:
        result = await qa_agent.run(user_message, model=model, deps=deps)
        output = result.output

        logger.info(
            "qa_answered",
            confidence=output.confidence,
            sources=output.sources,
        )

        response = output.answer
        if output.sources:
            response += "\n\n_参考来源：" + "、".join(output.sources) + "_"

        return {
            "qa_answer": output.answer,
            "response": response,
            "messages": [AIMessage(content=response)],
        }
    except Exception as e:
        logger.error("knowledge_qa_failed", error=str(e))
        error_response = "抱歉，知识查询过程中出现了问题，请稍后再试。"
        return {
            "qa_answer": None,
            "response": error_response,
            "messages": [AIMessage(content=error_response)],
        }
