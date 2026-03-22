from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TrainingPlanCreate(BaseModel):
    plan_name: str
    description: str
    days_per_week: int
    days: list[dict]
    methodology_notes: str | None = None
    warnings: list[str] = []
    constraints: str | None = None
    source: str = "chat"


class TrainingPlanUpdate(BaseModel):
    plan_name: str | None = None
    description: str | None = None
    days_per_week: int | None = None
    days: list[dict] | None = None
    methodology_notes: str | None = None
    warnings: list[str] | None = None
    constraints: str | None = None


class TrainingPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    plan_name: str
    description: str
    days_per_week: int
    days: list[dict]
    methodology_notes: str | None
    warnings: list
    constraints: str | None
    source: str
    status: str
    parent_plan_id: str | None
    created_at: datetime
    updated_at: datetime


class PlanGenerateRequest(BaseModel):
    constraints: str | None = None


class PlanRegenerateRequest(BaseModel):
    plan_id: str
    constraints: str | None = None
