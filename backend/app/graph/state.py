from typing import Annotated, TypedDict

from langgraph.graph.message import add_messages


class GymOpusState(TypedDict):
    messages: Annotated[list, add_messages]
    user_id: str
    user_profile: dict
    intent: str
    workout_plan: dict | None
    meal_plan: dict | None
    diet_analysis: dict | None
    qa_answer: str | None
    validation_result: dict | None
    retry_count: int
    response: str
    llm_config: dict  # serialized LLMConfig
