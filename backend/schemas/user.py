from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    name: str
    gender: Literal["male", "female", "other"] | None = None
    age: int | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    body_fat_pct: float | None = None
    experience: Literal["1-2", "2-3", "3-5", "5+"] | None = None
    training_goal: Literal["muscle", "fat-loss", "strength", "maintain"] | None = None
    injuries: str | None = None
    parq_answers: list[bool] = Field(default_factory=lambda: [False] * 7)


class UserUpdate(BaseModel):
    name: str | None = None
    gender: Literal["male", "female", "other"] | None = None
    age: int | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    body_fat_pct: float | None = None
    experience: Literal["1-2", "2-3", "3-5", "5+"] | None = None
    training_goal: Literal["muscle", "fat-loss", "strength", "maintain"] | None = None
    injuries: str | None = None
    parq_answers: list[bool] | None = None
    unit_system: Literal["metric", "imperial"] | None = None
    reminder_time: str | None = None
    alerts_enabled: bool | None = None


class UserResponse(BaseModel):
    id: str
    name: str
    gender: str | None = None
    age: int | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    body_fat_pct: float | None = None
    experience: str | None = None
    level: str = "intermediate"
    training_goal: str | None = None
    injuries: str | None = None
    parq_has_risk: bool = False
    unit_system: str = "metric"
    reminder_time: str = "18:00"
    alerts_enabled: bool = True
    created_at: str | None = None

    model_config = {"from_attributes": True}


class AIConfigUpdate(BaseModel):
    provider: Literal["openai", "anthropic", "deepseek", "custom"]
    model: str
    api_key: str | None = None
    base_url: str | None = None


class AIConfigResponse(BaseModel):
    id: str
    provider: str
    model: str
    api_key_masked: str | None = None
    base_url: str | None = None
    is_active: bool = True

    model_config = {"from_attributes": True}
