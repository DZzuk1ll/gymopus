from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.exercise import Exercise


async def search_exercises(
    session: AsyncSession,
    muscle_group: str | None = None,
    equipment: str | None = None,
    movement_pattern: str | None = None,
    is_compound: bool | None = None,
    limit: int = 10,
) -> list[dict]:
    query = select(Exercise)
    if muscle_group:
        query = query.where(Exercise.primary_muscle_group == muscle_group)
    if equipment:
        query = query.where(Exercise.equipment == equipment)
    if movement_pattern:
        query = query.where(Exercise.movement_pattern == movement_pattern)
    if is_compound is not None:
        query = query.where(Exercise.is_compound == is_compound)
    query = query.limit(limit)

    result = await session.execute(query)
    exercises = result.scalars().all()
    return [
        {
            "exercise_id": str(ex.id),
            "name_zh": ex.name_zh,
            "name_en": ex.name_en,
            "primary_muscle_group": ex.primary_muscle_group,
            "secondary_muscle_groups": ex.secondary_muscle_groups,
            "equipment": ex.equipment,
            "movement_pattern": ex.movement_pattern,
            "difficulty": ex.difficulty,
            "is_compound": ex.is_compound,
            "description_zh": ex.description_zh,
        }
        for ex in exercises
    ]
