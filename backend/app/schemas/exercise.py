from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ExerciseResponse(BaseModel):
    id: UUID
    name_zh: str
    name_en: str
    primary_muscle_group: str
    secondary_muscle_groups: list[str]
    equipment: str
    movement_pattern: str
    difficulty: str
    description_zh: str
    instructions_zh: str
    is_compound: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
