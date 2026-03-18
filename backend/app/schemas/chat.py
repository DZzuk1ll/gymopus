from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str
    intent: str
    workout_plan: dict | None = None
    meal_plan: dict | None = None
    diet_analysis: dict | None = None
