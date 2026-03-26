"""AI-powered training plan generation service."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from jinja2 import Environment, FileSystemLoader
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.plan import Plan, PlanDay, PlanExercise, PlanWeek
from models.user import User, UserAIConfig
from schemas.plan import (
    KnowledgeRefBrief,
    NutritionTargets,
    PlanGenerateRequest,
    PlanGenerateResponse,
    PlanSummary,
    WeekSummary,
)
from services.ai_integration import ai_client
from knowledge.retriever import retriever
from utils.calculations import calculate_bmr, calculate_nutrition_targets, calculate_tdee

DISCLAIMER = (
    "所有建议基于运动科学文献（NSCA / ACSM / JISSN），不构成医学诊断或处方。"
    "如有伤病、慢性疾病或特殊饮食需求，请咨询医生或持证营养师。"
    "用户对自身训练行为承担全部责任。"
)

GOAL_LABELS = {"muscle": "增肌", "fat-loss": "减脂", "strength": "力量", "maintain": "维持"}
SPLIT_LABELS = {"ppl": "推拉腿", "upper-lower": "上下肢", "full-body": "全身", "bro-split": "传统分化"}
EQUIPMENT_LABELS = {"commercial": "商业健身房", "home": "家用器械", "custom": "自定义"}
DIET_LABELS = {"surplus": "热量盈余", "deficit": "热量赤字", "maintain": "热量维持"}

_env = Environment(
    loader=FileSystemLoader(str(Path(__file__).parent.parent / "prompts")),
    autoescape=False,
)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def generate_plan(
    db: AsyncSession,
    req: PlanGenerateRequest,
) -> PlanGenerateResponse:
    """Full 6-step plan generation pipeline."""

    # Step 1: Parameter preprocessing
    user = await db.get(User, req.user_id)
    if not user:
        raise ValueError("User not found")

    height = req.height_cm or user.height_cm or 170
    weight = req.weight_kg or user.weight_kg or 70
    age = req.age or user.age or 25
    gender = req.gender or user.gender or "male"
    body_fat = req.body_fat_pct or user.body_fat_pct
    injuries = req.injuries or user.injuries
    parq_has_risk = user.parq_has_risk

    bmr = calculate_bmr(weight, height, age, gender)
    tdee = calculate_tdee(bmr, req.days_per_week, req.minutes_per_session)
    nutrition = calculate_nutrition_targets(tdee, weight, req.diet_goal, req.goal)
    nutrition_targets = NutritionTargets(**nutrition)

    # Step 2: Knowledge retrieval (RAG)
    query = f"{GOAL_LABELS.get(req.goal, req.goal)} {SPLIT_LABELS.get(req.split_type, req.split_type)} 训练计划 周期化 {req.experience}年经验"
    knowledge_entries = await retriever.search(query, categories=["training", "nutrition"], top_k=8)

    knowledge_refs = [
        KnowledgeRefBrief(id=e.id, source=e.source, section=e.section, title=e.title)
        for e in knowledge_entries
    ]

    # Step 3: Prompt assembly
    template = _env.get_template("plan_generation.j2")
    prompt = template.render(
        goal_label=GOAL_LABELS.get(req.goal, req.goal),
        experience=req.experience,
        split_type_label=SPLIT_LABELS.get(req.split_type, req.split_type),
        days_per_week=req.days_per_week,
        minutes_per_session=req.minutes_per_session,
        equipment_label=EQUIPMENT_LABELS.get(req.equipment, req.equipment),
        height_cm=height,
        weight_kg=weight,
        age=age,
        gender=gender,
        body_fat_pct=body_fat or "未知",
        injuries=injuries,
        parq_has_risk=parq_has_risk,
        diet_goal_label=DIET_LABELS.get(req.diet_goal, req.diet_goal),
        restrictions=", ".join(req.restrictions) if req.restrictions else None,
        tdee=int(tdee),
        nutrition_targets=nutrition_targets,
        knowledge_entries=knowledge_entries,
    )

    # Step 4: LLM call
    # Get user's AI config
    result = await db.execute(
        select(UserAIConfig).where(
            UserAIConfig.user_id == req.user_id,
            UserAIConfig.is_active == True,  # noqa: E712
        )
    )
    ai_config = result.scalar_one_or_none()
    if not ai_config:
        raise ValueError("No active AI configuration found. Please configure an AI provider first.")

    system_template = _env.get_template("system.j2")
    system_prompt = system_template.render()

    response_text = await ai_client.complete(
        provider=ai_config.provider,
        model=ai_config.model,
        api_key_enc=ai_config.api_key_enc,
        base_url=ai_config.base_url,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
        max_tokens=8192,
    )

    # Step 5: Parse and persist
    # Extract JSON from response
    response_text = response_text.strip()
    if response_text.startswith("```"):
        lines = response_text.split("\n")
        response_text = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])

    plan_data = json.loads(response_text)

    now = _now()
    plan = Plan(
        user_id=req.user_id,
        name=plan_data.get("plan_name", f"{GOAL_LABELS.get(req.goal, req.goal)}训练计划"),
        goal=req.goal,
        split_type=req.split_type,
        days_per_week=req.days_per_week,
        minutes_per_session=req.minutes_per_session,
        equipment=req.equipment,
        total_weeks=plan_data.get("total_weeks", 4),
        current_week=1,
        status="active",
        diet_goal=req.diet_goal,
        target_calories=nutrition_targets.calories,
        target_protein=nutrition_targets.protein_g,
        target_carbs=nutrition_targets.carbs_g,
        target_fat=nutrition_targets.fat_g,
        meals_per_day=req.meals_per_day,
        diet_restrictions=json.dumps(req.restrictions, ensure_ascii=False),
        generation_prompt=prompt[:5000],  # Truncate for storage
        generation_model=f"{ai_config.provider}/{ai_config.model}",
        knowledge_refs=json.dumps([e.id for e in knowledge_entries]),
        created_at=now,
        updated_at=now,
    )
    db.add(plan)
    await db.flush()

    week_summaries = []
    for week_data in plan_data.get("weeks", []):
        week = PlanWeek(
            plan_id=plan.id,
            week_number=week_data["week_number"],
            theme=week_data.get("theme"),
            volume_target=None,
            intensity_modifier=week_data.get("intensity_modifier", 1.0),
            notes=week_data.get("periodization_rationale") if week_data.get("week_number") == 1 else None,
        )
        db.add(week)
        await db.flush()

        days_count = 0
        for day_data in week_data.get("days", []):
            day = PlanDay(
                week_id=week.id,
                day_of_week=day_data["day_of_week"],
                day_type=day_data["day_type"],
                label=day_data.get("label"),
                target_muscles=json.dumps(day_data.get("target_muscles", []), ensure_ascii=False),
                estimated_duration=req.minutes_per_session,
                notes=None,
            )
            db.add(day)
            await db.flush()
            days_count += 1

            for idx, ex_data in enumerate(day_data.get("exercises", [])):
                exercise = PlanExercise(
                    day_id=day.id,
                    order_index=idx,
                    exercise_name=ex_data["exercise_name"],
                    exercise_name_en=ex_data.get("exercise_name_en"),
                    sets=ex_data["sets"],
                    reps_range=ex_data["reps_range"],
                    target_weight=None,
                    target_rpe=ex_data.get("target_rpe"),
                    rest_seconds=ex_data.get("rest_seconds"),
                    notes=ex_data.get("notes"),
                    superset_group=None,
                )
                db.add(exercise)

        week_summaries.append(WeekSummary(
            id=week.id,
            week_number=week.week_number,
            theme=week.theme,
            intensity_modifier=week.intensity_modifier or 1.0,
            days_count=days_count,
        ))

    await db.commit()

    # Step 6: Return response
    return PlanGenerateResponse(
        plan_id=plan.id,
        name=plan.name,
        summary=PlanSummary(
            total_weeks=plan.total_weeks,
            split_type=plan.split_type,
            days_per_week=plan.days_per_week,
            minutes_per_session=plan.minutes_per_session,
            periodization_model=plan_data.get("periodization_model"),
        ),
        nutrition_targets=nutrition_targets,
        weeks=week_summaries,
        knowledge_refs=knowledge_refs,
        disclaimer=DISCLAIMER,
    )
