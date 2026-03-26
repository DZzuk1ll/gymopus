from __future__ import annotations

import json
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.checkin import (
    BodyMetricsLog,
    CheckinRecord,
    ExerciseLog,
    MealLog,
    MoodLog,
    NutritionLog,
    SetLog,
    SleepLog,
    SupplementLog,
    TrainingLog,
)
from schemas.checkin import CheckinSubmit
from schemas.common import AlertBrief
from utils.calculations import calculate_training_volume


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def upsert_checkin(
    db: AsyncSession,
    data: CheckinSubmit,
    rule_engine=None,
) -> tuple[str, list[str], list[AlertBrief]]:
    """
    Upsert a checkin record and all sub-modules.
    Returns (checkin_id, completed_modules, alerts).
    """
    now = _now()

    # Find or create CheckinRecord
    result = await db.execute(
        select(CheckinRecord).where(
            CheckinRecord.user_id == data.user_id,
            CheckinRecord.date == data.date,
        )
    )
    checkin = result.scalar_one_or_none()

    if checkin:
        checkin.notes = data.notes if data.notes is not None else checkin.notes
        checkin.updated_at = now
    else:
        checkin = CheckinRecord(
            user_id=data.user_id,
            date=data.date,
            notes=data.notes,
            created_at=now,
            updated_at=now,
        )
        db.add(checkin)
        await db.flush()

    completed = set()
    existing_modules = json.loads(checkin.completed_modules) if checkin.completed_modules else []
    completed.update(existing_modules)

    # --- Training ---
    if data.training:
        completed.add("training")
        # Delete existing training log for this checkin
        existing = await db.execute(
            select(TrainingLog).where(TrainingLog.checkin_id == checkin.id)
        )
        old_log = existing.scalar_one_or_none()
        if old_log:
            await db.delete(old_log)
            await db.flush()

        all_sets_data = []
        tlog = TrainingLog(
            checkin_id=checkin.id,
            plan_day_id=data.training.plan_day_id,
            duration_min=data.training.duration_min,
            overall_rpe=data.training.overall_rpe,
        )
        db.add(tlog)
        await db.flush()

        total_sets = 0
        for idx, ex in enumerate(data.training.exercises):
            elog = ExerciseLog(
                training_log_id=tlog.id,
                plan_exercise_id=ex.plan_exercise_id,
                exercise_name=ex.exercise_name,
                order_index=idx,
            )
            db.add(elog)
            await db.flush()

            for s in ex.sets:
                slog = SetLog(
                    exercise_log_id=elog.id,
                    set_number=s.set_number,
                    target_reps=s.target_reps,
                    target_weight=s.target_weight,
                    actual_reps=s.actual_reps,
                    actual_weight=s.actual_weight,
                    rpe=s.rpe,
                )
                db.add(slog)
                all_sets_data.append(s.model_dump())
                total_sets += 1

        tlog.total_volume_kg = calculate_training_volume(all_sets_data)
        tlog.total_sets = total_sets

    # --- Nutrition ---
    if data.nutrition:
        completed.add("nutrition")
        existing = await db.execute(
            select(NutritionLog).where(NutritionLog.checkin_id == checkin.id)
        )
        old_log = existing.scalar_one_or_none()
        if old_log:
            await db.delete(old_log)
            await db.flush()

        total_cal = 0
        total_pro = 0.0
        total_carb = 0.0
        total_fat = 0.0

        nlog = NutritionLog(
            checkin_id=checkin.id,
            water_ml=data.nutrition.water_ml,
        )
        db.add(nlog)
        await db.flush()

        for meal in data.nutrition.meals:
            mlog = MealLog(
                nutrition_log_id=nlog.id,
                meal_name=meal.meal_name,
                items=json.dumps(meal.items, ensure_ascii=False),
                calories=meal.calories,
                protein=meal.protein,
                carbs=meal.carbs,
                fat=meal.fat,
                time=meal.time,
            )
            db.add(mlog)
            total_cal += meal.calories or 0
            total_pro += meal.protein or 0
            total_carb += meal.carbs or 0
            total_fat += meal.fat or 0

        nlog.total_calories = total_cal
        nlog.total_protein = total_pro
        nlog.total_carbs = total_carb
        nlog.total_fat = total_fat

    # --- Sleep ---
    if data.sleep:
        completed.add("sleep")
        existing = await db.execute(
            select(SleepLog).where(SleepLog.checkin_id == checkin.id)
        )
        old_log = existing.scalar_one_or_none()
        if old_log:
            await db.delete(old_log)
            await db.flush()

        slog = SleepLog(
            checkin_id=checkin.id,
            bed_time=data.sleep.bed_time,
            wake_time=data.sleep.wake_time,
            duration_hours=data.sleep.duration_hours,
            quality_score=data.sleep.quality_score,
            deep_sleep_pct=data.sleep.deep_sleep_pct,
        )
        db.add(slog)

    # --- Supplements ---
    if data.supplements:
        completed.add("supplements")
        existing = await db.execute(
            select(SupplementLog).where(SupplementLog.checkin_id == checkin.id)
        )
        old_log = existing.scalar_one_or_none()
        if old_log:
            await db.delete(old_log)
            await db.flush()

        suplog = SupplementLog(
            checkin_id=checkin.id,
            items=json.dumps([item.model_dump() for item in data.supplements.items], ensure_ascii=False),
        )
        db.add(suplog)

    # --- Mood ---
    if data.mood:
        completed.add("mood")
        existing = await db.execute(
            select(MoodLog).where(MoodLog.checkin_id == checkin.id)
        )
        old_log = existing.scalar_one_or_none()
        if old_log:
            await db.delete(old_log)
            await db.flush()

        moodlog = MoodLog(
            checkin_id=checkin.id,
            level=data.mood.level,
            description=data.mood.description,
            energy_level=data.mood.energy_level,
            stress_level=data.mood.stress_level,
        )
        db.add(moodlog)

    # --- Body Metrics ---
    if data.body_metrics:
        completed.add("body_metrics")
        existing = await db.execute(
            select(BodyMetricsLog).where(BodyMetricsLog.checkin_id == checkin.id)
        )
        old_log = existing.scalar_one_or_none()
        if old_log:
            await db.delete(old_log)
            await db.flush()

        bmlog = BodyMetricsLog(
            checkin_id=checkin.id,
            weight_kg=data.body_metrics.weight_kg,
            body_fat_pct=data.body_metrics.body_fat_pct,
            chest_cm=data.body_metrics.chest_cm,
            waist_cm=data.body_metrics.waist_cm,
            arm_cm=data.body_metrics.arm_cm,
        )
        db.add(bmlog)

    checkin.completed_modules = json.dumps(sorted(completed))
    await db.commit()

    # --- Rule engine evaluation ---
    alerts: list[AlertBrief] = []
    if rule_engine is None:
        from services.rule_engine import RuleEngine
        rule_engine = RuleEngine()
    alerts = await rule_engine.evaluate(db, data.user_id, data.date)

    # --- Async AI analysis if multi-signal detected ---
    ai_signal = next((a for a in alerts if a.id == "AI_CROSS_SIGNAL"), None)
    if ai_signal:
        import asyncio
        signals = [
            {"description": a.title, "value": a.severity, "trend": "neutral"}
            for a in alerts if a.id != "AI_CROSS_SIGNAL"
        ]

        async def _run_ai_analysis():
            try:
                from database import async_session
                from services.ai_analyzer import analyze_signals
                async with async_session() as ai_db:
                    await analyze_signals(ai_db, data.user_id, signals)
            except Exception:
                pass  # AI analysis failure should not affect checkin

        asyncio.create_task(_run_ai_analysis())

    return checkin.id, sorted(completed), alerts
