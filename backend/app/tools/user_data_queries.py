import uuid
from datetime import date, timedelta

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.training_plan import TrainingPlan
from app.models.workout_log import WorkoutLog
from app.models.meal import MealLog
from app.models.daily_status import DailyStatus
from app.models.user import User


async def query_training_data(session: AsyncSession, user_id: uuid.UUID) -> dict:
    """Return active training plan + last 7 days workout logs."""
    # Active plan
    plan_stmt = (
        select(TrainingPlan)
        .where(TrainingPlan.user_id == user_id, TrainingPlan.status == "active")
        .order_by(TrainingPlan.updated_at.desc())
        .limit(1)
    )
    plan_result = await session.execute(plan_stmt)
    plan = plan_result.scalar_one_or_none()

    # Recent workout logs
    start = date.today() - timedelta(days=7)
    log_stmt = (
        select(WorkoutLog)
        .where(WorkoutLog.user_id == user_id, WorkoutLog.logged_date >= start)
        .order_by(WorkoutLog.logged_date.desc())
    )
    log_result = await session.execute(log_stmt)
    logs = log_result.scalars().all()

    return {
        "active_plan": {
            "plan_name": plan.plan_name,
            "days_per_week": plan.days_per_week,
            "description": plan.description,
            "days": plan.days,
        } if plan else None,
        "recent_workouts": [
            {
                "date": str(log.logged_date),
                "exercise": log.exercise_name,
                "sets": log.sets_completed,
                "reps": log.reps_completed,
                "weight_kg": log.weight_kg,
                "rpe": log.rpe,
            }
            for log in logs
        ],
        "workout_count_7d": len(logs),
    }


async def query_diet_data(session: AsyncSession, user_id: uuid.UUID) -> dict:
    """Return last 7 days meal logs with daily macro summaries."""
    start = date.today() - timedelta(days=7)
    stmt = (
        select(MealLog)
        .where(MealLog.user_id == user_id, MealLog.logged_date >= start)
        .order_by(MealLog.logged_date.desc())
    )
    result = await session.execute(stmt)
    logs = result.scalars().all()

    # Daily summaries
    daily: dict[str, dict] = {}
    for log in logs:
        day_key = str(log.logged_date)
        if day_key not in daily:
            daily[day_key] = {"calories": 0, "protein": 0, "fat": 0, "carbs": 0, "meals": 0}
        daily[day_key]["meals"] += 1
        daily[day_key]["calories"] += log.total_calories or 0
        daily[day_key]["protein"] += log.total_protein or 0
        daily[day_key]["fat"] += log.total_fat or 0
        daily[day_key]["carbs"] += log.total_carbs or 0

    return {
        "daily_summaries": daily,
        "total_logs_7d": len(logs),
        "recent_meals": [
            {
                "date": str(log.logged_date),
                "meal_type": log.meal_type,
                "description": log.raw_description,
                "calories": log.total_calories,
                "protein": log.total_protein,
                "fat": log.total_fat,
                "carbs": log.total_carbs,
            }
            for log in logs[:10]
        ],
    }


async def query_body_status(session: AsyncSession, user_id: uuid.UUID) -> dict:
    """Return 7 days of DailyStatus with weight trend and averages."""
    start = date.today() - timedelta(days=7)
    stmt = (
        select(DailyStatus)
        .where(DailyStatus.user_id == user_id, DailyStatus.date >= start)
        .order_by(DailyStatus.date.desc())
    )
    result = await session.execute(stmt)
    records = result.scalars().all()

    if not records:
        return {"records": [], "averages": None, "weight_trend": None}

    def avg(vals: list) -> float | None:
        filtered = [v for v in vals if v is not None]
        return round(sum(filtered) / len(filtered), 1) if filtered else None

    weights = [r.weight_kg for r in records if r.weight_kg]
    weight_trend = None
    if len(weights) >= 2:
        weight_trend = round(weights[0] - weights[-1], 1)  # newest - oldest

    return {
        "records": [
            {
                "date": str(r.date),
                "weight_kg": r.weight_kg,
                "sleep_hours": r.sleep_hours,
                "sleep_quality": r.sleep_quality,
                "fatigue_level": r.fatigue_level,
                "stress_level": r.stress_level,
                "mood": r.mood,
            }
            for r in records
        ],
        "averages": {
            "sleep_hours": avg([r.sleep_hours for r in records]),
            "sleep_quality": avg([r.sleep_quality for r in records]),
            "fatigue_level": avg([r.fatigue_level for r in records]),
            "stress_level": avg([r.stress_level for r in records]),
            "mood": avg([r.mood for r in records]),
        },
        "weight_trend": weight_trend,
    }


async def query_user_profile(session: AsyncSession, user_id: uuid.UUID) -> dict:
    """Return user basic info, goals, equipment, and injuries."""
    stmt = select(User).where(User.id == user_id)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        return {"error": "用户不存在"}

    return {
        "gender": user.gender,
        "age": user.age,
        "height_cm": user.height_cm,
        "weight_kg": user.weight_kg,
        "body_fat_pct": user.body_fat_pct,
        "training_goal": user.training_goal,
        "training_experience_years": user.training_experience_years,
        "training_frequency_per_week": user.training_frequency_per_week,
        "session_duration_minutes": user.session_duration_minutes,
        "available_equipment": user.available_equipment,
        "dietary_restrictions": user.dietary_restrictions,
        "dietary_preferences": user.dietary_preferences,
        "injuries": user.injuries,
    }
