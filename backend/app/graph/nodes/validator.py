import structlog
from sqlalchemy import select

from app.graph.state import GymOpusState
from app.models.exercise import Exercise
from app.database import async_session

logger = structlog.get_logger()


async def validator(state: GymOpusState) -> dict:
    workout_plan = state.get("workout_plan")
    if not workout_plan:
        return {
            "validation_result": {"valid": True, "errors": []},
        }

    errors = []

    # Collect all exercise IDs from the plan
    exercise_ids = []
    for day in workout_plan.get("days", []):
        for ex in day.get("exercises", []):
            exercise_ids.append(ex.get("exercise_id", ""))

            # Validate sets and reps ranges
            sets = ex.get("sets", 0)
            if not (1 <= sets <= 10):
                errors.append(
                    f"动作 {ex.get('name', '?')} 的组数 {sets} 不在合理范围(1-10)"
                )
            reps_max = ex.get("reps_max", 0)
            if not (1 <= reps_max <= 30):
                errors.append(
                    f"动作 {ex.get('name', '?')} 的次数 {reps_max} 不在合理范围(1-30)"
                )

    # Validate exercise IDs exist in database
    if exercise_ids:
        async with async_session() as session:
            result = await session.execute(
                select(Exercise.id).where(
                    Exercise.id.in_([eid for eid in exercise_ids if eid])
                )
            )
            existing_ids = {str(row[0]) for row in result.all()}
            for eid in exercise_ids:
                if eid and eid not in existing_ids:
                    errors.append(f"动作 ID {eid} 在知识库中不存在")

    valid = len(errors) == 0
    logger.info("validation_completed", valid=valid, error_count=len(errors))

    retry_count = state.get("retry_count", 0)
    if not valid:
        retry_count += 1

    return {
        "validation_result": {"valid": valid, "errors": errors},
        "retry_count": retry_count,
    }
