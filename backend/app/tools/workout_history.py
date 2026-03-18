"""Workout history lookup and progressive overload suggestions.

Progressive overload rules (NSCA / ACSM guidelines):
- Increase load by 2-5% when target reps are achieved for all sets
- Use RPE-based auto-regulation: RPE < 7 → increase, RPE 7-9 → maintain, RPE 10 → decrease
- Beginners: increase every session; Intermediate: weekly; Advanced: periodized
"""

from __future__ import annotations

import uuid
from datetime import date, timedelta

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workout_log import WorkoutLog


async def get_exercise_history(
    session: AsyncSession,
    user_id: uuid.UUID,
    exercise_id: uuid.UUID | None = None,
    exercise_name: str | None = None,
    limit: int = 20,
) -> list[dict]:
    """Get recent workout history for a specific exercise."""
    stmt = select(WorkoutLog).where(WorkoutLog.user_id == user_id)
    if exercise_id:
        stmt = stmt.where(WorkoutLog.exercise_id == exercise_id)
    elif exercise_name:
        stmt = stmt.where(WorkoutLog.exercise_name.ilike(f"%{exercise_name}%"))
    stmt = stmt.order_by(desc(WorkoutLog.logged_date)).limit(limit)
    result = await session.execute(stmt)
    logs = result.scalars().all()
    return [
        {
            "logged_date": str(log.logged_date),
            "exercise_name": log.exercise_name,
            "sets_completed": log.sets_completed,
            "reps_completed": log.reps_completed,
            "weight_kg": log.weight_kg,
            "rpe": log.rpe,
        }
        for log in logs
    ]


def suggest_progression(history: list[dict]) -> dict:
    """Suggest progressive overload based on recent history.

    Rules:
    - If last session RPE < 7 and all reps hit: increase weight 2.5-5%
    - If RPE 7-9: maintain current weight, try for more reps
    - If RPE >= 10 or failed reps: consider deload (-10%)
    - Minimum increment: 2.5 kg (barbell), 1 kg (dumbbell)
    """
    if not history:
        return {"suggestion": "暂无历史数据，建议从适中重量开始", "action": "start"}

    latest = history[0]
    weight = latest.get("weight_kg")
    rpe = latest.get("rpe")
    reps = latest.get("reps_completed", 0)
    sets = latest.get("sets_completed", 0)

    if weight is None:
        return {
            "suggestion": f"上次完成 {sets}组×{reps}次（自重），保持即可",
            "action": "maintain",
            "last_weight": None,
        }

    if rpe is not None and rpe >= 10:
        new_weight = round(weight * 0.9 / 2.5) * 2.5
        return {
            "suggestion": f"上次 {weight}kg RPE={rpe}，感觉很吃力，建议降至 {new_weight}kg",
            "action": "deload",
            "last_weight": weight,
            "suggested_weight": new_weight,
        }

    if rpe is not None and rpe < 7:
        increment = max(2.5, round(weight * 0.025 / 2.5) * 2.5)
        new_weight = weight + increment
        return {
            "suggestion": f"上次 {weight}kg×{reps}次 RPE={rpe}，余力充足，建议增至 {new_weight}kg",
            "action": "increase",
            "last_weight": weight,
            "suggested_weight": new_weight,
        }

    # RPE 7-9 or no RPE: maintain and try for more reps
    return {
        "suggestion": f"上次 {weight}kg×{reps}次，建议保持 {weight}kg 争取更多次数",
        "action": "maintain",
        "last_weight": weight,
        "suggested_weight": weight,
    }
