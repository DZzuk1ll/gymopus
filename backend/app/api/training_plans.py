import uuid
from datetime import date, timedelta

import structlog
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, async_session
from app.api.deps import get_current_user, get_llm_config, LLMConfig
from app.api.rate_limit import check_rate_limit, increment_rate_limit
from app.models.user import User
from app.models.daily_status import DailyStatus
from app.models.training_plan import TrainingPlan
from app.schemas import ApiResponse
from app.schemas.training_plan import (
    TrainingPlanCreate,
    TrainingPlanUpdate,
    TrainingPlanResponse,
    PlanGenerateRequest,
    PlanRegenerateRequest,
)
from app.agents.workout_agent import workout_agent
from app.agents.deps import AgentDeps, create_model

logger = structlog.get_logger()

router = APIRouter(prefix="/training-plans", tags=["training-plans"])


def _serialize_profile(user: User) -> dict:
    return {
        "id": str(user.id),
        "gender": user.gender,
        "age": user.age,
        "height_cm": user.height_cm,
        "weight_kg": user.weight_kg,
        "training_goal": user.training_goal,
        "training_experience_years": user.training_experience_years,
        "training_frequency_per_week": user.training_frequency_per_week,
        "session_duration_minutes": user.session_duration_minutes,
        "available_equipment": user.available_equipment,
        "injuries": user.injuries,
    }


def _build_profile_summary(user: User) -> str:
    return (
        f"性别={user.gender or '未知'}, "
        f"年龄={user.age or '未知'}, "
        f"身高={user.height_cm or '未知'}cm, "
        f"体重={user.weight_kg or '未知'}kg, "
        f"训练目标={user.training_goal or '未知'}, "
        f"训练经验={user.training_experience_years or '未知'}年, "
        f"每周训练={user.training_frequency_per_week or '未知'}天, "
        f"单次时长={user.session_duration_minutes or '未知'}分钟, "
        f"可用器械={user.available_equipment or []}, "
        f"伤病={user.injuries or []}"
    )


async def _get_fatigue_context(user_id: uuid.UUID) -> str:
    """Query recent DailyStatus to check fatigue levels."""
    try:
        async with async_session() as session:
            stmt = (
                select(DailyStatus)
                .where(DailyStatus.user_id == user_id)
                .where(DailyStatus.date >= date.today() - timedelta(days=3))
                .order_by(DailyStatus.date.desc())
            )
            result = await session.execute(stmt)
            records = result.scalars().all()

        if not records:
            return ""

        avg_fatigue = sum(r.fatigue_level for r in records if r.fatigue_level) / max(
            sum(1 for r in records if r.fatigue_level), 1
        )
        avg_sleep = sum(r.sleep_hours for r in records if r.sleep_hours) / max(
            sum(1 for r in records if r.sleep_hours), 1
        )

        parts = []
        if avg_fatigue >= 4:
            parts.append(f"近3天平均疲劳度较高（{avg_fatigue:.1f}/5），建议降低训练容量和强度")
        if avg_sleep and avg_sleep < 6:
            parts.append(f"近3天平均睡眠不足（{avg_sleep:.1f}小时），注意恢复")
        return "\n".join(parts)
    except Exception:
        return ""


@router.post("")
async def create_training_plan(
    body: TrainingPlanCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[TrainingPlanResponse]:
    plan = TrainingPlan(
        user_id=user.id,
        plan_name=body.plan_name,
        description=body.description,
        days_per_week=body.days_per_week,
        days=body.days,
        methodology_notes=body.methodology_notes,
        warnings=body.warnings,
        constraints=body.constraints,
        source=body.source,
        status="draft",
    )
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return ApiResponse.ok(TrainingPlanResponse.model_validate(plan))


@router.get("")
async def list_training_plans(
    status: str | None = Query(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[list[TrainingPlanResponse]]:
    stmt = (
        select(TrainingPlan)
        .where(TrainingPlan.user_id == user.id)
        .order_by(TrainingPlan.updated_at.desc())
    )
    if status:
        stmt = stmt.where(TrainingPlan.status == status)
    result = await db.execute(stmt)
    plans = result.scalars().all()
    return ApiResponse.ok([TrainingPlanResponse.model_validate(p) for p in plans])


@router.get("/{plan_id}")
async def get_training_plan(
    plan_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[TrainingPlanResponse]:
    stmt = select(TrainingPlan).where(
        TrainingPlan.id == uuid.UUID(plan_id),
        TrainingPlan.user_id == user.id,
    )
    result = await db.execute(stmt)
    plan = result.scalar_one_or_none()
    if not plan:
        return ApiResponse.fail("训练计划不存在")
    return ApiResponse.ok(TrainingPlanResponse.model_validate(plan))


@router.patch("/{plan_id}")
async def update_training_plan(
    plan_id: str,
    body: TrainingPlanUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[TrainingPlanResponse]:
    stmt = select(TrainingPlan).where(
        TrainingPlan.id == uuid.UUID(plan_id),
        TrainingPlan.user_id == user.id,
    )
    result = await db.execute(stmt)
    plan = result.scalar_one_or_none()
    if not plan:
        return ApiResponse.fail("训练计划不存在")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(plan, key, value)

    await db.commit()
    await db.refresh(plan)
    return ApiResponse.ok(TrainingPlanResponse.model_validate(plan))


@router.post("/{plan_id}/activate")
async def activate_training_plan(
    plan_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[TrainingPlanResponse]:
    stmt = select(TrainingPlan).where(
        TrainingPlan.id == uuid.UUID(plan_id),
        TrainingPlan.user_id == user.id,
    )
    result = await db.execute(stmt)
    plan = result.scalar_one_or_none()
    if not plan:
        return ApiResponse.fail("训练计划不存在")

    # Archive all currently active plans
    await db.execute(
        update(TrainingPlan)
        .where(TrainingPlan.user_id == user.id, TrainingPlan.status == "active")
        .values(status="archived")
    )

    plan.status = "active"
    await db.commit()
    await db.refresh(plan)
    return ApiResponse.ok(TrainingPlanResponse.model_validate(plan))


@router.post("/{plan_id}/archive")
async def archive_training_plan(
    plan_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[TrainingPlanResponse]:
    stmt = select(TrainingPlan).where(
        TrainingPlan.id == uuid.UUID(plan_id),
        TrainingPlan.user_id == user.id,
    )
    result = await db.execute(stmt)
    plan = result.scalar_one_or_none()
    if not plan:
        return ApiResponse.fail("训练计划不存在")

    plan.status = "archived"
    await db.commit()
    await db.refresh(plan)
    return ApiResponse.ok(TrainingPlanResponse.model_validate(plan))


@router.post("/generate")
async def generate_training_plan(
    body: PlanGenerateRequest,
    user: User = Depends(get_current_user),
    llm_config: LLMConfig = Depends(get_llm_config),
    db: AsyncSession = Depends(get_db),
    _rate_limit: None = Depends(check_rate_limit),
) -> ApiResponse[dict]:
    model = create_model(llm_config)
    deps = AgentDeps(
        session_factory=async_session, user_profile=_serialize_profile(user)
    )

    prompt = f"用户画像：{_build_profile_summary(user)}\n\n请根据用户画像制定完整的训练计划。"
    if body.constraints:
        prompt += f"\n\n用户额外要求：{body.constraints}"

    fatigue_ctx = await _get_fatigue_context(user.id)
    if fatigue_ctx:
        prompt += f"\n\n身体状态提醒：\n{fatigue_ctx}"

    try:
        result = await workout_agent.run(prompt, model=model, deps=deps)
    except Exception as e:
        logger.error("training_plan_generation_failed", error=str(e))
        return ApiResponse.fail(f"生成训练计划失败：{str(e)}")

    await increment_rate_limit(user.id, llm_config, db)
    plan_data = result.output.model_dump()
    if body.constraints:
        plan_data["constraints"] = body.constraints
    return ApiResponse.ok(plan_data)


@router.post("/regenerate")
async def regenerate_training_plan(
    body: PlanRegenerateRequest,
    user: User = Depends(get_current_user),
    llm_config: LLMConfig = Depends(get_llm_config),
    db: AsyncSession = Depends(get_db),
    _rate_limit: None = Depends(check_rate_limit),
) -> ApiResponse[dict]:
    # Fetch the parent plan for context
    stmt = select(TrainingPlan).where(
        TrainingPlan.id == uuid.UUID(body.plan_id),
        TrainingPlan.user_id == user.id,
    )
    result = await db.execute(stmt)
    parent_plan = result.scalar_one_or_none()
    if not parent_plan:
        return ApiResponse.fail("原计划不存在")

    model = create_model(llm_config)
    deps = AgentDeps(
        session_factory=async_session, user_profile=_serialize_profile(user)
    )

    prompt = (
        f"用户画像：{_build_profile_summary(user)}\n\n"
        f"用户之前有一个训练计划「{parent_plan.plan_name}」，现在需要重新生成。"
    )
    if body.constraints:
        prompt += f"\n\n新的要求：{body.constraints}"
    elif parent_plan.constraints:
        prompt += f"\n\n原有要求：{parent_plan.constraints}"

    fatigue_ctx = await _get_fatigue_context(user.id)
    if fatigue_ctx:
        prompt += f"\n\n身体状态提醒：\n{fatigue_ctx}"

    try:
        agent_result = await workout_agent.run(prompt, model=model, deps=deps)
    except Exception as e:
        logger.error("training_plan_regeneration_failed", error=str(e))
        return ApiResponse.fail(f"重新生成训练计划失败：{str(e)}")

    await increment_rate_limit(user.id, llm_config, db)
    plan_data = agent_result.output.model_dump()
    plan_data["constraints"] = body.constraints or parent_plan.constraints
    plan_data["parent_plan_id"] = str(parent_plan.id)
    return ApiResponse.ok(plan_data)
