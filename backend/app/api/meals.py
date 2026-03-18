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
from app.models.meal import MealLog
from app.schemas import ApiResponse
from app.schemas.meal import (
    MealPlanResponse,
    MealLogCreate,
    MealLogResponse,
    DietAnalysisResponse,
)
from app.agents.meal_agent import meal_agent
from app.agents.diet_agent import diet_agent
from app.agents.deps import AgentDeps, create_model

logger = structlog.get_logger()

router = APIRouter(prefix="/meals", tags=["meals"])


def _build_profile_summary(user: User) -> str:
    return (
        f"性别={user.gender or '未知'}, "
        f"年龄={user.age or '未知'}, "
        f"身高={user.height_cm or '未知'}cm, "
        f"体重={user.weight_kg or '未知'}kg, "
        f"训练目标={user.training_goal or '未知'}, "
        f"每周训练={user.training_frequency_per_week or '未知'}天"
    )


def _serialize_profile(user: User) -> dict:
    return {
        "gender": user.gender,
        "age": user.age,
        "height_cm": user.height_cm,
        "weight_kg": user.weight_kg,
        "training_goal": user.training_goal,
        "training_frequency_per_week": user.training_frequency_per_week,
    }


@router.post("/generate")
async def generate_meal_plan(
    user: User = Depends(get_current_user),
    llm_config: LLMConfig = Depends(get_llm_config),
    db: AsyncSession = Depends(get_db),
    _rate_limit: None = Depends(check_rate_limit),
) -> ApiResponse[MealPlanResponse]:
    model = create_model(llm_config)
    deps = AgentDeps(session_factory=async_session, user_profile=_serialize_profile(user))

    prompt = f"用户画像：{_build_profile_summary(user)}\n\n请根据用户画像制定一日饮食计划。"

    try:
        result = await meal_agent.run(prompt, model=model, deps=deps)
    except Exception as e:
        logger.error("meal_plan_generation_failed", error=str(e))
        return ApiResponse.fail(f"生成饮食计划失败：{str(e)}")

    await increment_rate_limit(user.id, llm_config, db)
    return ApiResponse.ok(MealPlanResponse(**result.output.model_dump()))


@router.post("/logs")
async def create_meal_log(
    body: MealLogCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[MealLogResponse]:
    log = MealLog(
        user_id=user.id,
        logged_date=body.logged_date,
        meal_type=body.meal_type,
        raw_description=body.raw_description,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return ApiResponse.ok(MealLogResponse.model_validate(log))


@router.get("/logs")
async def list_meal_logs(
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[list[MealLogResponse]]:
    if end_date is None:
        end_date = date.today()
    if start_date is None:
        start_date = end_date - timedelta(days=7)

    stmt = (
        select(MealLog)
        .where(MealLog.user_id == user.id)
        .where(MealLog.logged_date >= start_date)
        .where(MealLog.logged_date <= end_date)
        .order_by(MealLog.logged_date.desc(), MealLog.meal_type)
    )
    result = await db.execute(stmt)
    logs = result.scalars().all()
    return ApiResponse.ok([MealLogResponse.model_validate(log) for log in logs])


@router.post("/analyze")
async def analyze_diet(
    body: MealLogCreate,
    user: User = Depends(get_current_user),
    llm_config: LLMConfig = Depends(get_llm_config),
    db: AsyncSession = Depends(get_db),
    _rate_limit: None = Depends(check_rate_limit),
) -> ApiResponse[DietAnalysisResponse]:
    model = create_model(llm_config)
    deps = AgentDeps(session_factory=async_session, user_profile=_serialize_profile(user))

    prompt = (
        f"用户画像：{_build_profile_summary(user)}\n\n"
        f"用户描述的饮食：{body.raw_description}"
    )

    try:
        result = await diet_agent.run(prompt, model=model, deps=deps)
    except Exception as e:
        logger.error("diet_analysis_failed", error=str(e))
        return ApiResponse.fail(f"饮食分析失败：{str(e)}")

    analysis = result.output

    # Save as meal log with analysis results
    log = MealLog(
        user_id=user.id,
        logged_date=body.logged_date,
        meal_type=body.meal_type,
        raw_description=body.raw_description,
        parsed_foods=[f.model_dump() for f in analysis.parsed_foods],
        total_calories=analysis.totals.calories,
        total_protein=analysis.totals.protein_g,
        total_fat=analysis.totals.fat_g,
        total_carbs=analysis.totals.carbs_g,
        analysis_notes=analysis.assessment,
    )
    db.add(log)
    await db.commit()

    await increment_rate_limit(user.id, llm_config, db)
    return ApiResponse.ok(DietAnalysisResponse(**analysis.model_dump()))
