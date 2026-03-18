import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict


class WorkoutLogCreate(BaseModel):
    logged_date: date
    exercise_id: uuid.UUID | None = None
    exercise_name: str
    sets_completed: int
    reps_completed: int
    weight_kg: float | None = None
    rpe: float | None = None
    notes: str | None = None


class WorkoutLogBatchCreate(BaseModel):
    entries: list[WorkoutLogCreate]


class WorkoutLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    logged_date: date
    exercise_id: uuid.UUID | None = None
    exercise_name: str
    sets_completed: int
    reps_completed: int
    weight_kg: float | None = None
    rpe: float | None = None
    notes: str | None = None
