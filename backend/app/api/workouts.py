import uuid
from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.workout_log import WorkoutLog
from app.schemas import ApiResponse
from app.schemas.workout_log import (
    WorkoutLogCreate,
    WorkoutLogBatchCreate,
    WorkoutLogResponse,
)
from app.tools.workout_history import get_exercise_history, suggest_progression

router = APIRouter(prefix="/workouts", tags=["workouts"])


@router.post("/logs")
async def create_workout_logs(
    body: WorkoutLogBatchCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[list[WorkoutLogResponse]]:
    logs = []
    for entry in body.entries:
        log = WorkoutLog(
            user_id=user.id,
            logged_date=entry.logged_date,
            exercise_id=entry.exercise_id,
            exercise_name=entry.exercise_name,
            sets_completed=entry.sets_completed,
            reps_completed=entry.reps_completed,
            weight_kg=entry.weight_kg,
            rpe=entry.rpe,
            notes=entry.notes,
        )
        db.add(log)
        logs.append(log)
    await db.commit()
    for log in logs:
        await db.refresh(log)
    return ApiResponse.ok([WorkoutLogResponse.model_validate(log) for log in logs])


@router.get("/logs")
async def list_workout_logs(
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    exercise_name: str | None = Query(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[list[WorkoutLogResponse]]:
    if end_date is None:
        end_date = date.today()
    if start_date is None:
        start_date = end_date - timedelta(days=30)

    stmt = (
        select(WorkoutLog)
        .where(WorkoutLog.user_id == user.id)
        .where(WorkoutLog.logged_date >= start_date)
        .where(WorkoutLog.logged_date <= end_date)
    )
    if exercise_name:
        stmt = stmt.where(WorkoutLog.exercise_name.ilike(f"%{exercise_name}%"))
    stmt = stmt.order_by(WorkoutLog.logged_date.desc())

    result = await db.execute(stmt)
    logs = result.scalars().all()
    return ApiResponse.ok([WorkoutLogResponse.model_validate(log) for log in logs])


@router.get("/logs/exercise/{exercise_id}/history")
async def get_exercise_log_history(
    exercise_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[dict]:
    history = await get_exercise_history(db, user.id, exercise_id=exercise_id)
    progression = suggest_progression(history)
    return ApiResponse.ok({
        "history": history,
        "progression": progression,
    })
