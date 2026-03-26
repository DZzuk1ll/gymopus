from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models.plan import Plan, PlanDay, PlanExercise, PlanWeek
from schemas.plan import (
    PlanDayDetail,
    PlanDetailResponse,
    PlanExerciseDetail,
    PlanGenerateRequest,
    PlanGenerateResponse,
    PlanResponse,
    PlanUpdate,
    TodayWorkoutResponse,
    WeekDetail,
    WeekSummary,
)

router = APIRouter(prefix="/api/v1/plans", tags=["plans"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_json_list(val: str | None) -> list:
    if not val:
        return []
    try:
        return json.loads(val)
    except (json.JSONDecodeError, TypeError):
        return []


def _plan_to_response(plan: Plan) -> PlanResponse:
    return PlanResponse(
        id=plan.id,
        name=plan.name,
        goal=plan.goal,
        split_type=plan.split_type,
        days_per_week=plan.days_per_week,
        minutes_per_session=plan.minutes_per_session,
        equipment=plan.equipment,
        total_weeks=plan.total_weeks,
        current_week=plan.current_week or 1,
        status=plan.status or "active",
        diet_goal=plan.diet_goal,
        target_calories=plan.target_calories,
        target_protein=plan.target_protein,
        target_carbs=plan.target_carbs,
        target_fat=plan.target_fat,
        meals_per_day=plan.meals_per_day,
        diet_restrictions=_parse_json_list(plan.diet_restrictions),
        created_at=plan.created_at,
    )


def _exercise_to_detail(ex: PlanExercise) -> PlanExerciseDetail:
    return PlanExerciseDetail(
        id=ex.id,
        order_index=ex.order_index,
        exercise_name=ex.exercise_name,
        exercise_name_en=ex.exercise_name_en,
        sets=ex.sets,
        reps_range=ex.reps_range,
        target_weight=ex.target_weight,
        target_rpe=ex.target_rpe,
        rest_seconds=ex.rest_seconds,
        notes=ex.notes,
        superset_group=ex.superset_group,
    )


def _day_to_detail(day: PlanDay) -> PlanDayDetail:
    return PlanDayDetail(
        id=day.id,
        day_of_week=day.day_of_week,
        day_type=day.day_type,
        label=day.label,
        target_muscles=_parse_json_list(day.target_muscles),
        estimated_duration=day.estimated_duration,
        notes=day.notes,
        exercises=[_exercise_to_detail(ex) for ex in day.exercises],
    )


def _week_to_detail(week: PlanWeek) -> WeekDetail:
    return WeekDetail(
        id=week.id,
        week_number=week.week_number,
        theme=week.theme,
        volume_target=week.volume_target,
        intensity_modifier=week.intensity_modifier or 1.0,
        notes=week.notes,
        days=[_day_to_detail(d) for d in week.days],
    )


@router.post("/generate", response_model=PlanGenerateResponse, status_code=201)
async def generate_plan(body: PlanGenerateRequest, db: AsyncSession = Depends(get_db)):
    from services.plan_generator import generate_plan
    try:
        return await generate_plan(db, body)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Plan generation failed: {str(e)}")


@router.get("", response_model=list[PlanResponse])
async def list_plans(
    user_id: str = Query(...),
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Plan).where(Plan.user_id == user_id)
    if status:
        stmt = stmt.where(Plan.status == status)
    stmt = stmt.order_by(Plan.created_at.desc())
    result = await db.execute(stmt)
    plans = result.scalars().all()
    return [_plan_to_response(p) for p in plans]


@router.get("/{plan_id}", response_model=PlanDetailResponse)
async def get_plan(plan_id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Plan)
        .where(Plan.id == plan_id)
        .options(
            selectinload(Plan.weeks)
            .selectinload(PlanWeek.days)
            .selectinload(PlanDay.exercises)
        )
    )
    result = await db.execute(stmt)
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    resp = _plan_to_response(plan).model_dump()
    resp["weeks"] = [_week_to_detail(w).model_dump() for w in plan.weeks]
    resp["knowledge_refs"] = []
    return PlanDetailResponse(**resp)


@router.put("/{plan_id}", response_model=PlanResponse)
async def update_plan(plan_id: str, body: PlanUpdate, db: AsyncSession = Depends(get_db)):
    plan = await db.get(Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    update_data = body.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(plan, k, v)
    plan.updated_at = _now()
    await db.commit()
    await db.refresh(plan)
    return _plan_to_response(plan)


@router.delete("/{plan_id}")
async def delete_plan(plan_id: str, db: AsyncSession = Depends(get_db)):
    plan = await db.get(Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    await db.delete(plan)
    await db.commit()
    return {"status": "deleted"}


@router.get("/{plan_id}/weeks", response_model=list[WeekSummary])
async def get_plan_weeks(plan_id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(PlanWeek)
        .where(PlanWeek.plan_id == plan_id)
        .options(selectinload(PlanWeek.days))
        .order_by(PlanWeek.week_number)
    )
    result = await db.execute(stmt)
    weeks = result.scalars().all()
    return [
        WeekSummary(
            id=w.id,
            week_number=w.week_number,
            theme=w.theme,
            intensity_modifier=w.intensity_modifier or 1.0,
            days_count=len(w.days),
        )
        for w in weeks
    ]


@router.get("/{plan_id}/weeks/{week_number}", response_model=WeekDetail)
async def get_plan_week(plan_id: str, week_number: int, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(PlanWeek)
        .where(PlanWeek.plan_id == plan_id, PlanWeek.week_number == week_number)
        .options(selectinload(PlanWeek.days).selectinload(PlanDay.exercises))
    )
    result = await db.execute(stmt)
    week = result.scalar_one_or_none()
    if not week:
        raise HTTPException(status_code=404, detail="Week not found")
    return _week_to_detail(week)


@router.get("/{plan_id}/today", response_model=TodayWorkoutResponse)
async def get_today_workout(plan_id: str, db: AsyncSession = Depends(get_db)):
    plan = await db.get(Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # Python: Monday=0, design doc: Monday=1
    today_dow = datetime.now().weekday() + 1  # 1=Mon, 7=Sun

    stmt = (
        select(PlanWeek)
        .where(PlanWeek.plan_id == plan_id, PlanWeek.week_number == (plan.current_week or 1))
        .options(selectinload(PlanWeek.days).selectinload(PlanDay.exercises))
    )
    result = await db.execute(stmt)
    week = result.scalar_one_or_none()

    if not week:
        return TodayWorkoutResponse(
            plan_day=None, is_rest_day=True,
            week_number=plan.current_week or 1, day_of_week=today_dow,
        )

    matching_day = next((d for d in week.days if d.day_of_week == today_dow), None)

    if not matching_day or matching_day.day_type in ("rest", "active-recovery"):
        return TodayWorkoutResponse(
            plan_day=None, is_rest_day=True,
            week_number=week.week_number, day_of_week=today_dow,
        )

    return TodayWorkoutResponse(
        plan_day=_day_to_detail(matching_day),
        is_rest_day=False,
        week_number=week.week_number,
        day_of_week=today_dow,
    )
