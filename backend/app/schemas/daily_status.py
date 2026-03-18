import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class DailyStatusCreate(BaseModel):
    date: date
    weight_kg: float | None = None
    sleep_hours: float | None = None
    sleep_quality: int | None = Field(None, ge=1, le=5)
    fatigue_level: int | None = Field(None, ge=1, le=5)
    stress_level: int | None = Field(None, ge=1, le=5)
    mood: int | None = Field(None, ge=1, le=5)
    notes: str | None = None


class DailyStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    date: date
    weight_kg: float | None = None
    sleep_hours: float | None = None
    sleep_quality: int | None = None
    fatigue_level: int | None = None
    stress_level: int | None = None
    mood: int | None = None
    notes: str | None = None
