from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.checkin import (
    BodyMetricsLog,
    CheckinRecord,
    MoodLog,
    NutritionLog,
    SleepLog,
    TrainingLog,
)
from models.plan import Plan, PlanWeek
from schemas.trends import (
    BodyTrend,
    CycleAnnotation,
    DataPoint,
    MoodTrend,
    NutritionTrend,
    SleepTrend,
    TrainingTrend,
    TrendsResponse,
)


async def get_trends(
    db: AsyncSession,
    user_id: str,
    range_days: int = 30,
    dimensions: str = "all",
) -> TrendsResponse:
    end_date = date.today()
    start_date = end_date - timedelta(days=range_days)
    start_str = start_date.isoformat()
    end_str = end_date.isoformat()

    dim_set = set(dimensions.split(",")) if dimensions != "all" else {"training", "body", "nutrition", "sleep", "mood"}

    # Fetch all checkins in range
    stmt = (
        select(CheckinRecord)
        .where(
            CheckinRecord.user_id == user_id,
            CheckinRecord.date >= start_str,
            CheckinRecord.date <= end_str,
        )
        .order_by(CheckinRecord.date)
    )
    result = await db.execute(stmt)
    checkins = result.scalars().all()
    checkin_ids = [c.id for c in checkins]
    checkin_dates = {c.id: c.date for c in checkins}

    training = None
    if "training" in dim_set and checkin_ids:
        stmt = select(TrainingLog).where(TrainingLog.checkin_id.in_(checkin_ids))
        result = await db.execute(stmt)
        logs = result.scalars().all()

        daily_volume = []
        weekly_buckets: dict[str, float] = {}
        for log in logs:
            d = checkin_dates.get(log.checkin_id, "")
            vol = log.total_volume_kg or 0
            daily_volume.append(DataPoint(date=d, value=vol))
            # weekly: use ISO week
            if d:
                week_key = d[:7]  # approximate by year-month
                weekly_buckets[week_key] = weekly_buckets.get(week_key, 0) + vol

        weekly_volume = [DataPoint(date=k, value=v) for k, v in sorted(weekly_buckets.items())]

        # Get volume target from active plan
        plan_result = await db.execute(
            select(Plan).where(Plan.user_id == user_id, Plan.status == "active").limit(1)
        )
        active_plan = plan_result.scalar_one_or_none()
        weekly_target = None
        if active_plan:
            week_result = await db.execute(
                select(PlanWeek).where(
                    PlanWeek.plan_id == active_plan.id,
                    PlanWeek.week_number == (active_plan.current_week or 1),
                )
            )
            current_week = week_result.scalar_one_or_none()
            if current_week and current_week.volume_target:
                weekly_target = current_week.volume_target

        training = TrainingTrend(
            daily_volume=daily_volume,
            weekly_volume=weekly_volume,
            weekly_volume_target=weekly_target,
        )

    body = None
    if "body" in dim_set and checkin_ids:
        stmt = select(BodyMetricsLog).where(BodyMetricsLog.checkin_id.in_(checkin_ids))
        result = await db.execute(stmt)
        logs = result.scalars().all()
        daily_weight = [
            DataPoint(date=checkin_dates.get(log.checkin_id, ""), value=log.weight_kg)
            for log in logs if log.weight_kg is not None
        ]
        body = BodyTrend(daily_weight=daily_weight)

    nutrition = None
    if "nutrition" in dim_set and checkin_ids:
        stmt = select(NutritionLog).where(NutritionLog.checkin_id.in_(checkin_ids))
        result = await db.execute(stmt)
        logs = result.scalars().all()
        daily_calories = [
            DataPoint(date=checkin_dates.get(log.checkin_id, ""), value=log.total_calories)
            for log in logs if log.total_calories is not None
        ]
        daily_protein = [
            DataPoint(date=checkin_dates.get(log.checkin_id, ""), value=log.total_protein)
            for log in logs if log.total_protein is not None
        ]
        targets = {}
        if active_plan := (await db.execute(
            select(Plan).where(Plan.user_id == user_id, Plan.status == "active").limit(1)
        )).scalar_one_or_none():
            if active_plan.target_calories:
                targets["calories"] = active_plan.target_calories
            if active_plan.target_protein:
                targets["protein"] = active_plan.target_protein

        nutrition = NutritionTrend(
            daily_calories=daily_calories,
            daily_protein=daily_protein,
            targets=targets,
        )

    sleep = None
    if "sleep" in dim_set and checkin_ids:
        stmt = select(SleepLog).where(SleepLog.checkin_id.in_(checkin_ids))
        result = await db.execute(stmt)
        logs = result.scalars().all()
        sleep = SleepTrend(
            daily_duration=[
                DataPoint(date=checkin_dates.get(log.checkin_id, ""), value=log.duration_hours)
                for log in logs if log.duration_hours is not None
            ],
            daily_quality=[
                DataPoint(date=checkin_dates.get(log.checkin_id, ""), value=log.quality_score)
                for log in logs if log.quality_score is not None
            ],
        )

    mood = None
    if "mood" in dim_set and checkin_ids:
        stmt = select(MoodLog).where(MoodLog.checkin_id.in_(checkin_ids))
        result = await db.execute(stmt)
        logs = result.scalars().all()
        mood = MoodTrend(
            daily_level=[
                DataPoint(date=checkin_dates.get(log.checkin_id, ""), value=log.level)
                for log in logs
            ],
        )

    # Cycle annotations from plans
    cycle_annotations: list[CycleAnnotation] = []

    return TrendsResponse(
        range_days=range_days,
        start_date=start_str,
        end_date=end_str,
        training=training,
        body=body,
        nutrition=nutrition,
        sleep=sleep,
        mood=mood,
        cycle_annotations=cycle_annotations,
    )
