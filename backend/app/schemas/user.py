from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class UserUpdate(BaseModel):
    gender: str | None = None
    age: int | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    body_fat_pct: float | None = None
    training_goal: str | None = None
    training_experience_years: float | None = None
    training_frequency_per_week: int | None = None
    session_duration_minutes: int | None = None
    available_equipment: list[str] | None = None
    dietary_restrictions: list[str] | None = None
    dietary_preferences: list[str] | None = None
    injuries: list[str] | None = None
    onboarding_completed: bool | None = None


class UserResponse(BaseModel):
    id: UUID
    gender: str | None
    age: int | None
    height_cm: float | None
    weight_kg: float | None
    body_fat_pct: float | None
    training_goal: str | None
    training_experience_years: float | None
    training_frequency_per_week: int | None
    session_duration_minutes: int | None
    available_equipment: list[str]
    dietary_restrictions: list[str]
    dietary_preferences: list[str]
    injuries: list[str]
    onboarding_completed: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
