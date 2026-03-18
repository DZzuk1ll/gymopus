import structlog
from langchain_core.messages import HumanMessage

from app.graph.state import GymOpusState
from app.agents.intent_agent import intent_agent
from app.agents.deps import create_model
from app.api.deps import LLMConfig

logger = structlog.get_logger()


async def intent_router(state: GymOpusState) -> dict:
    # Extract latest user message
    messages = state["messages"]
    user_message = ""
    for msg in reversed(messages):
        if isinstance(msg, HumanMessage) or (
            isinstance(msg, dict) and msg.get("role") == "user"
        ):
            user_message = msg.content if hasattr(msg, "content") else msg.get("content", "")
            break

    if not user_message:
        return {"intent": "chitchat"}

    llm_config = LLMConfig(**state["llm_config"])
    model = create_model(llm_config)

    result = await intent_agent.run(user_message, model=model)
    logger.info("intent_classified", intent=result.output.intent, reasoning=result.output.reasoning)
    return {"intent": result.output.intent}
