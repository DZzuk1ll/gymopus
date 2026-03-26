from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models.checkin import (
    BodyMetricsLog,
    CheckinRecord,
    ExerciseLog,
    MoodLog,
    NutritionLog,
    SleepLog,
    SupplementLog,
    TrainingLog,
)
from schemas.checkin import (
    BodyMetricsLogResponse,
    CheckinDetailResponse,
    CheckinResponse,
    CheckinSubmit,
    ExerciseLogResponse,
    MealLogResponse,
    MoodLogResponse,
    NutritionLogResponse,
    SetLogResponse,
    SleepLogResponse,
    SupplementLogResponse,
    TrainingLogResponse,
)
from services.checkin_service import upsert_checkin

router = APIRouter(prefix="/api/v1/checkins", tags=["checkins"])


def _parse_json(val: str | None) -> list:
    if not val:
        return []
    try:
        return json.loads(val)
    except (json.JSONDecodeError, TypeError):
        return []


def _build_detail(checkin: CheckinRecord) -> CheckinDetailResponse:
    training = None
    if checkin.training_log:
        tl = checkin.training_log
        exercises = []
        for elog in tl.exercise_logs:
            exercises.append(ExerciseLogResponse(
                id=elog.id,
                exercise_name=elog.exercise_name,
                order_index=elog.order_index,
                plan_exercise_id=elog.plan_exercise_id,
                sets=[
                    SetLogResponse(
                        id=s.id, set_number=s.set_number,
                        target_reps=s.target_reps, target_weight=s.target_weight,
                        actual_reps=s.actual_reps, actual_weight=s.actual_weight,
                        rpe=s.rpe,
                    )
                    for s in elog.set_logs
                ],
            ))
        training = TrainingLogResponse(
            plan_day_id=tl.plan_day_id,
            total_volume_kg=tl.total_volume_kg,
            total_sets=tl.total_sets,
            duration_min=tl.duration_min,
            overall_rpe=tl.overall_rpe,
            exercises=exercises,
        )

    nutrition = None
    if checkin.nutrition_log:
        nl = checkin.nutrition_log
        nutrition = NutritionLogResponse(
            total_calories=nl.total_calories,
            total_protein=nl.total_protein,
            total_carbs=nl.total_carbs,
            total_fat=nl.total_fat,
            water_ml=nl.water_ml,
            meals=[
                MealLogResponse(
                    meal_name=m.meal_name,
                    items=_parse_json(m.items),
                    calories=m.calories,
                    protein=m.protein,
                    carbs=m.carbs,
                    fat=m.fat,
                    time=m.time,
                )
                for m in nl.meals
            ],
        )

    sleep = None
    if checkin.sleep_log:
        sl = checkin.sleep_log
        sleep = SleepLogResponse(
            bed_time=sl.bed_time, wake_time=sl.wake_time,
            duration_hours=sl.duration_hours, quality_score=sl.quality_score,
            deep_sleep_pct=sl.deep_sleep_pct,
        )

    supplements = None
    if checkin.supplement_log:
        supplements = SupplementLogResponse(items=_parse_json(checkin.supplement_log.items))

    mood = None
    if checkin.mood_log:
        ml = checkin.mood_log
        mood = MoodLogResponse(
            level=ml.level, description=ml.description,
            energy_level=ml.energy_level, stress_level=ml.stress_level,
        )

    body_metrics = None
    if checkin.body_metrics_log:
        bm = checkin.body_metrics_log
        body_metrics = BodyMetricsLogResponse(
            weight_kg=bm.weight_kg, body_fat_pct=bm.body_fat_pct,
            chest_cm=bm.chest_cm, waist_cm=bm.waist_cm, arm_cm=bm.arm_cm,
        )

    return CheckinDetailResponse(
        id=checkin.id,
        date=checkin.date,
        completed_modules=_parse_json(checkin.completed_modules),
        notes=checkin.notes,
        training=training,
        nutrition=nutrition,
        sleep=sleep,
        supplements=supplements,
        mood=mood,
        body_metrics=body_metrics,
        created_at=checkin.created_at,
    )


def _checkin_load_options():
    return [
        selectinload(CheckinRecord.training_log)
        .selectinload(TrainingLog.exercise_logs)
        .selectinload(ExerciseLog.set_logs),
        selectinload(CheckinRecord.nutrition_log)
        .selectinload(NutritionLog.meals),
        selectinload(CheckinRecord.sleep_log),
        selectinload(CheckinRecord.supplement_log),
        selectinload(CheckinRecord.mood_log),
        selectinload(CheckinRecord.body_metrics_log),
    ]


@router.post("", response_model=CheckinResponse)
async def submit_checkin(body: CheckinSubmit, db: AsyncSession = Depends(get_db)):
    checkin_id, completed_modules, alerts = await upsert_checkin(db, body)
    return CheckinResponse(
        checkin_id=checkin_id,
        date=body.date,
        completed_modules=completed_modules,
        alerts=alerts,
    )


@router.get("/{user_id}/{date}", response_model=CheckinDetailResponse)
async def get_checkin_by_date(user_id: str, date: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(CheckinRecord)
        .where(CheckinRecord.user_id == user_id, CheckinRecord.date == date)
        .options(*_checkin_load_options())
    )
    result = await db.execute(stmt)
    checkin = result.scalar_one_or_none()
    if not checkin:
        raise HTTPException(status_code=404, detail="Checkin not found")
    return _build_detail(checkin)


@router.get("/{user_id}", response_model=list[CheckinDetailResponse])
async def list_checkins(
    user_id: str,
    start: str | None = Query(None),
    end: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(CheckinRecord)
        .where(CheckinRecord.user_id == user_id)
        .options(*_checkin_load_options())
    )
    if start:
        stmt = stmt.where(CheckinRecord.date >= start)
    if end:
        stmt = stmt.where(CheckinRecord.date <= end)
    stmt = stmt.order_by(CheckinRecord.date.desc())

    result = await db.execute(stmt)
    checkins = result.scalars().all()
    return [_build_detail(c) for c in checkins]
