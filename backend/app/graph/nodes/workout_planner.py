import json

import structlog
from langchain_core.messages import HumanMessage, AIMessage

from app.graph.state import GymOpusState
from app.agents.workout_agent import workout_agent
from app.agents.deps import AgentDeps, create_model
from app.api.deps import LLMConfig
from app.database import async_session

logger = structlog.get_logger()


def _build_prompt(state: GymOpusState) -> str:
    """Build prompt with user message and profile context."""
    messages = state["messages"]
    user_message = ""
    for msg in reversed(messages):
        if isinstance(msg, HumanMessage) or (
            isinstance(msg, dict) and msg.get("role") == "user"
        ):
            user_message = msg.content if hasattr(msg, "content") else msg.get("content", "")
            break

    profile = state.get("user_profile", {})
    profile_summary = (
        f"用户画像：性别={profile.get('gender', '未知')}, "
        f"年龄={profile.get('age', '未知')}, "
        f"身高={profile.get('height_cm', '未知')}cm, "
        f"体重={profile.get('weight_kg', '未知')}kg, "
        f"训练目标={profile.get('training_goal', '未知')}, "
        f"训练经验={profile.get('training_experience_years', '未知')}年, "
        f"每周训练={profile.get('training_frequency_per_week', '未知')}天, "
        f"单次时长={profile.get('session_duration_minutes', '未知')}分钟, "
        f"可用器械={profile.get('available_equipment', [])}, "
        f"伤病={profile.get('injuries', [])}"
    )

    return f"{profile_summary}\n\n用户需求：{user_message}"


def _format_workout_response(plan: dict) -> str:
    """Format workout plan as readable Chinese text."""
    lines = [f"## {plan['plan_name']}", "", plan["description"], ""]
    for day in plan["days"]:
        lines.append(f"### {day['day_name']}（{day['focus']}）")
        for i, ex in enumerate(day["exercises"], 1):
            reps = f"{ex['reps_min']}-{ex['reps_max']}" if ex["reps_min"] != ex["reps_max"] else str(ex["reps_min"])
            lines.append(f"{i}. **{ex['name']}** — {ex['sets']}组 × {reps}次，休息{ex['rest_seconds']}秒")
            if ex.get("notes"):
                lines.append(f"   _{ex['notes']}_")
        lines.append("")
    if plan.get("methodology_notes"):
        lines.extend(["**方法论说明：**", plan["methodology_notes"], ""])
    if plan.get("warnings"):
        lines.append("**注意事项：**")
        for w in plan["warnings"]:
            lines.append(f"- {w}")
    return "\n".join(lines)


async def _get_fatigue_context(user_id: str) -> str:
    """Query recent DailyStatus to check fatigue levels."""
    from datetime import date, timedelta
    from sqlalchemy import select
    from app.models.daily_status import DailyStatus
    import uuid

    try:
        async with async_session() as session:
            stmt = (
                select(DailyStatus)
                .where(DailyStatus.user_id == uuid.UUID(user_id))
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


async def workout_planner(state: GymOpusState) -> dict:
    llm_config = LLMConfig(**state["llm_config"])
    model = create_model(llm_config)

    deps = AgentDeps(
        session_factory=async_session,
        user_profile=state.get("user_profile", {}),
    )

    prompt = _build_prompt(state)

    # Cross-module: check fatigue status
    fatigue_ctx = await _get_fatigue_context(state.get("user_id", ""))
    if fatigue_ctx:
        prompt += f"\n\n身体状态提醒：\n{fatigue_ctx}"

    result = await workout_agent.run(prompt, model=model, deps=deps)
    plan_dict = result.output.model_dump()

    logger.info("workout_plan_generated", plan_name=plan_dict["plan_name"])

    response_text = _format_workout_response(plan_dict)
    return {
        "workout_plan": plan_dict,
        "response": response_text,
        "messages": [AIMessage(content=response_text)],
    }
