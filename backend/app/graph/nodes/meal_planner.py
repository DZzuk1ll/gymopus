import structlog
from langchain_core.messages import HumanMessage, AIMessage

from app.graph.state import GymOpusState
from app.agents.meal_agent import meal_agent
from app.agents.deps import AgentDeps, create_model
from app.api.deps import LLMConfig
from app.database import async_session

logger = structlog.get_logger()


def _build_meal_prompt(state: GymOpusState) -> str:
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
        f"每周训练={profile.get('training_frequency_per_week', '未知')}天"
    )

    return f"{profile_summary}\n\n用户需求：{user_message}"


def _format_meal_response(plan: dict) -> str:
    """Format meal plan as readable Chinese text."""
    lines = [f"## {plan['plan_name']}", ""]

    target = plan.get("target", {})
    lines.append(
        f"**每日目标**：{target.get('calories', 0):.0f} kcal | "
        f"蛋白质 {target.get('protein_g', 0):.0f}g | "
        f"脂肪 {target.get('fat_g', 0):.0f}g | "
        f"碳水 {target.get('carbs_g', 0):.0f}g"
    )
    lines.append("")

    for meal in plan.get("meals", []):
        lines.append(f"### {meal['meal_name']}")
        for food in meal.get("foods", []):
            lines.append(
                f"- **{food['name']}** {food['portion_g']:.0f}g — "
                f"{food['calories']:.0f}kcal, "
                f"蛋白质{food['protein']:.1f}g"
            )
        lines.append("")

    total = plan.get("total", {})
    lines.append(
        f"**实际总计**：{total.get('calories', 0):.0f} kcal | "
        f"蛋白质 {total.get('protein_g', 0):.0f}g | "
        f"脂肪 {total.get('fat_g', 0):.0f}g | "
        f"碳水 {total.get('carbs_g', 0):.0f}g"
    )

    if plan.get("notes"):
        lines.extend(["", f"**说明**：{plan['notes']}"])
    if plan.get("warnings"):
        lines.append("")
        lines.append("**注意事项**：")
        for w in plan["warnings"]:
            lines.append(f"- {w}")

    return "\n".join(lines)


async def meal_planner(state: GymOpusState) -> dict:
    llm_config = LLMConfig(**state["llm_config"])
    model = create_model(llm_config)

    deps = AgentDeps(
        session_factory=async_session,
        user_profile=state.get("user_profile", {}),
    )

    prompt = _build_meal_prompt(state)

    # Cross-module: estimate training day vs rest day for calorie/macro adjustment
    profile = state.get("user_profile", {})
    freq = profile.get("training_frequency_per_week")
    if freq and isinstance(freq, int):
        from datetime import date
        weekday = date.today().weekday()  # 0=Mon, 6=Sun
        training_days_map = {
            1: {0},
            2: {0, 3},
            3: {0, 2, 4},
            4: {0, 1, 3, 4},
            5: {0, 1, 2, 3, 4},
            6: {0, 1, 2, 3, 4, 5},
            7: {0, 1, 2, 3, 4, 5, 6},
        }
        is_training_day = weekday in training_days_map.get(freq, set())
        day_type = "训练日" if is_training_day else "休息日"
        prompt += (
            f"\n\n今天推测为{day_type}。"
            f"训练日应增加碳水化合物摄入(+200-300kcal)以支持训练和恢复，"
            f"蛋白质保持充足；休息日可适当降低碳水，保持蛋白质不变。"
        )

    try:
        result = await meal_agent.run(prompt, model=model, deps=deps)
        plan_dict = result.output.model_dump()

        logger.info("meal_plan_generated", plan_name=plan_dict["plan_name"])

        response_text = _format_meal_response(plan_dict)
        return {
            "meal_plan": plan_dict,
            "response": response_text,
            "messages": [AIMessage(content=response_text)],
        }
    except Exception as e:
        logger.error("meal_planner_failed", error=str(e))
        error_response = "抱歉，生成饮食计划时出现了问题。请稍后重试，或尝试提供更具体的需求描述。"
        return {
            "meal_plan": None,
            "response": error_response,
            "messages": [AIMessage(content=error_response)],
        }
