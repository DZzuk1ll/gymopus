import structlog
from langchain_core.messages import HumanMessage, AIMessage

from app.graph.state import GymOpusState
from app.agents.diet_agent import diet_agent
from app.agents.deps import AgentDeps, create_model
from app.api.deps import LLMConfig
from app.database import async_session

logger = structlog.get_logger()


def _build_diet_prompt(state: GymOpusState) -> str:
    """Build prompt for diet analysis."""
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
        f"体重={profile.get('weight_kg', '未知')}kg, "
        f"训练目标={profile.get('training_goal', '未知')}, "
        f"每周训练={profile.get('training_frequency_per_week', '未知')}天"
    )

    return f"{profile_summary}\n\n用户描述的饮食：{user_message}"


def _format_diet_response(analysis: dict) -> str:
    """Format diet analysis as readable Chinese text."""
    lines = ["## 饮食分析", ""]

    for food in analysis.get("parsed_foods", []):
        lines.append(
            f"- **{food['name']}** ~{food['estimated_portion_g']:.0f}g — "
            f"{food['calories']:.0f}kcal, "
            f"蛋白质{food['protein']:.1f}g, "
            f"脂肪{food['fat']:.1f}g, "
            f"碳水{food['carbs']:.1f}g"
        )

    totals = analysis.get("totals", {})
    lines.extend([
        "",
        f"**合计**：{totals.get('calories', 0):.0f} kcal | "
        f"蛋白质 {totals.get('protein_g', 0):.0f}g | "
        f"脂肪 {totals.get('fat_g', 0):.0f}g | "
        f"碳水 {totals.get('carbs_g', 0):.0f}g",
    ])

    targets = analysis.get("targets")
    if targets:
        lines.extend([
            "",
            f"**目标**：{targets.get('calories', 0):.0f} kcal | "
            f"蛋白质 {targets.get('protein_g', 0):.0f}g | "
            f"脂肪 {targets.get('fat_g', 0):.0f}g | "
            f"碳水 {targets.get('carbs_g', 0):.0f}g",
        ])

    assessment = analysis.get("assessment", "")
    if assessment:
        lines.extend(["", f"**评价**：{assessment}"])

    suggestions = analysis.get("suggestions", [])
    if suggestions:
        lines.append("")
        lines.append("**建议**：")
        for s in suggestions:
            lines.append(f"- {s}")

    return "\n".join(lines)


async def diet_analyzer(state: GymOpusState) -> dict:
    llm_config = LLMConfig(**state["llm_config"])
    model = create_model(llm_config)

    deps = AgentDeps(
        session_factory=async_session,
        user_profile=state.get("user_profile", {}),
    )

    prompt = _build_diet_prompt(state)

    # Cross-module: estimate training day vs rest day for calorie adjustment
    profile = state.get("user_profile", {})
    freq = profile.get("training_frequency_per_week")
    if freq and isinstance(freq, int):
        from datetime import date
        weekday = date.today().weekday()  # 0=Mon, 6=Sun
        # Heuristic: if training 3x/week, assume Mon/Wed/Fri are training days
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
        prompt += f"\n\n今天推测为{day_type}。训练日碳水可适当增加(+200-300kcal)，休息日可适当降低碳水。"

    try:
        result = await diet_agent.run(prompt, model=model, deps=deps)
        analysis_dict = result.output.model_dump()

        logger.info("diet_analysis_completed", confidence=analysis_dict.get("confidence"))

        response_text = _format_diet_response(analysis_dict)
        return {
            "diet_analysis": analysis_dict,
            "response": response_text,
            "messages": [AIMessage(content=response_text)],
        }
    except Exception as e:
        logger.error("diet_analyzer_failed", error=str(e))
        error_response = "抱歉，分析饮食时出现了问题。请稍后重试，或尝试更清晰地描述你吃了什么。"
        return {
            "diet_analysis": None,
            "response": error_response,
            "messages": [AIMessage(content=error_response)],
        }
