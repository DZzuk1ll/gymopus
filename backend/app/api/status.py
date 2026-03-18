import uuid
from datetime import date, timedelta

import structlog
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, async_session
from app.api.deps import get_current_user, get_llm_config, LLMConfig
from app.api.rate_limit import check_rate_limit, increment_rate_limit
from app.models.user import User
from app.models.daily_status import DailyStatus
from app.schemas import ApiResponse
from app.schemas.daily_status import DailyStatusCreate, DailyStatusResponse
from app.schemas.status import StatusReportResponse, StatusAverages, WeightTrend
from app.utils.trends import calc_weekly_summary, calc_monthly_summary
from app.agents.report_agent import report_agent, WeeklyReport
from app.agents.deps import create_model

logger = structlog.get_logger()

router = APIRouter(prefix="/status", tags=["status"])


@router.post("/daily")
async def upsert_daily_status(
    body: DailyStatusCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[DailyStatusResponse]:
    # Check for existing record (upsert)
    stmt = select(DailyStatus).where(
        DailyStatus.user_id == user.id,
        DailyStatus.date == body.date,
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()

    if existing:
        for field, value in body.model_dump(exclude_unset=True).items():
            setattr(existing, field, value)
        await db.commit()
        await db.refresh(existing)
        return ApiResponse.ok(DailyStatusResponse.model_validate(existing))

    status = DailyStatus(user_id=user.id, **body.model_dump())
    db.add(status)
    await db.commit()
    await db.refresh(status)
    return ApiResponse.ok(DailyStatusResponse.model_validate(status))


@router.get("/daily")
async def list_daily_status(
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[list[DailyStatusResponse]]:
    if end_date is None:
        end_date = date.today()
    if start_date is None:
        start_date = end_date - timedelta(days=30)

    stmt = (
        select(DailyStatus)
        .where(DailyStatus.user_id == user.id)
        .where(DailyStatus.date >= start_date)
        .where(DailyStatus.date <= end_date)
        .order_by(DailyStatus.date)
    )
    result = await db.execute(stmt)
    records = result.scalars().all()
    return ApiResponse.ok([DailyStatusResponse.model_validate(r) for r in records])


@router.get("/report")
async def get_status_report(
    period: str = Query("weekly", pattern="^(weekly|monthly)$"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[StatusReportResponse]:
    end_date = date.today()
    if period == "weekly":
        start_date = end_date - timedelta(days=7)
    else:
        start_date = end_date - timedelta(days=30)

    stmt = (
        select(DailyStatus)
        .where(DailyStatus.user_id == user.id)
        .where(DailyStatus.date >= start_date)
        .where(DailyStatus.date <= end_date)
        .order_by(DailyStatus.date)
    )
    result = await db.execute(stmt)
    records = result.scalars().all()

    records_dicts = [
        {
            "date": r.date,
            "weight_kg": r.weight_kg,
            "sleep_hours": r.sleep_hours,
            "sleep_quality": r.sleep_quality,
            "fatigue_level": r.fatigue_level,
            "stress_level": r.stress_level,
            "mood": r.mood,
        }
        for r in records
    ]

    if period == "weekly":
        summary = calc_weekly_summary(records_dicts)
    else:
        summary = calc_monthly_summary(records_dicts)

    return ApiResponse.ok(
        StatusReportResponse(
            period=period,
            start_date=str(start_date),
            end_date=str(end_date),
            weight_trend=[WeightTrend(**w) for w in summary["weight_trend"]],
            averages=StatusAverages(**summary.get("averages", {})),
            weight_change=summary.get("weight_change"),
            data_points=summary["data_points"],
        )
    )


@router.get("/weekly-report")
async def get_weekly_ai_report(
    user: User = Depends(get_current_user),
    llm_config: LLMConfig = Depends(get_llm_config),
    db: AsyncSession = Depends(get_db),
    _rate_limit: None = Depends(check_rate_limit),
) -> ApiResponse[dict]:
    end_date = date.today()
    start_date = end_date - timedelta(days=7)

    # Gather status data
    stmt = (
        select(DailyStatus)
        .where(DailyStatus.user_id == user.id)
        .where(DailyStatus.date >= start_date)
        .where(DailyStatus.date <= end_date)
        .order_by(DailyStatus.date)
    )
    result = await db.execute(stmt)
    status_records = result.scalars().all()

    status_data = calc_weekly_summary([
        {
            "date": r.date,
            "weight_kg": r.weight_kg,
            "sleep_hours": r.sleep_hours,
            "sleep_quality": r.sleep_quality,
            "fatigue_level": r.fatigue_level,
            "stress_level": r.stress_level,
            "mood": r.mood,
        }
        for r in status_records
    ])

    # Gather meal log data
    from app.models.meal import MealLog

    meal_stmt = (
        select(MealLog)
        .where(MealLog.user_id == user.id)
        .where(MealLog.logged_date >= start_date)
        .where(MealLog.logged_date <= end_date)
    )
    meal_result = await db.execute(meal_stmt)
    meal_logs = meal_result.scalars().all()
    diet_data = {
        "meal_count": len(meal_logs),
        "avg_calories": (
            sum(m.total_calories for m in meal_logs if m.total_calories) / len(meal_logs)
            if meal_logs
            else None
        ),
    }

    # Gather workout log data
    from app.models.workout_log import WorkoutLog

    workout_stmt = (
        select(WorkoutLog)
        .where(WorkoutLog.user_id == user.id)
        .where(WorkoutLog.logged_date >= start_date)
        .where(WorkoutLog.logged_date <= end_date)
    )
    workout_result = await db.execute(workout_stmt)
    workout_logs = workout_result.scalars().all()
    training_data = {
        "session_count": len(workout_logs),
        "exercises_logged": len(set(w.exercise_name for w in workout_logs)),
    }

    prompt = (
        f"周报数据（{start_date} ~ {end_date}）：\n"
        f"身体状态：{status_data}\n"
        f"饮食记录：{diet_data}\n"
        f"训练记录：{training_data}"
    )

    model = create_model(llm_config)

    try:
        result = await report_agent.run(prompt, model=model)
    except Exception as e:
        logger.error("weekly_report_failed", error=str(e))
        return ApiResponse.fail(f"生成周报失败：{str(e)}")

    await increment_rate_limit(user.id, llm_config, db)
    return ApiResponse.ok(result.output.model_dump())
