import structlog
from langchain_core.messages import HumanMessage, AIMessage

from app.graph.state import GymOpusState
from app.agents.context_agent import context_agent
from app.agents.deps import AgentDeps, create_model
from app.api.deps import LLMConfig
from app.database import async_session

logger = structlog.get_logger()


async def data_analyzer(state: GymOpusState) -> dict:
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

    profile = state.get("user_profile", {})
    deps = AgentDeps(
        session_factory=async_session,
        user_profile=profile,
    )

    prompt = f"用户问题：{user_message}"

    try:
        result = await context_agent.run(prompt, model=model, deps=deps)
        output = result.output

        logger.info("data_analysis_completed", insights_count=len(output.insights))

        # Format response
        lines = [f"## 数据分析", "", output.summary]

        if output.insights:
            lines.extend(["", "**洞察：**"])
            for insight in output.insights:
                lines.append(f"- {insight}")

        if output.concerns:
            lines.extend(["", "**需要关注：**"])
            for concern in output.concerns:
                lines.append(f"- {concern}")

        if output.recommendations:
            lines.extend(["", "**建议：**"])
            for rec in output.recommendations:
                lines.append(f"- {rec}")

        response = "\n".join(lines)

        return {
            "analysis_response": output.model_dump(),
            "response": response,
            "messages": [AIMessage(content=response)],
        }
    except Exception as e:
        logger.error("data_analysis_failed", error=str(e))
        error_response = "抱歉，分析数据时出现了问题，请稍后再试。"
        return {
            "analysis_response": None,
            "response": error_response,
            "messages": [AIMessage(content=error_response)],
        }
