from pydantic import BaseModel
from pydantic_ai import Agent, RunContext

from app.agents.deps import AgentDeps
from app.tools.exercise_search import search_exercises
from app.tools.methodology_search import search_methodology


class ExerciseInPlan(BaseModel):
    exercise_id: str
    name: str
    sets: int
    reps_min: int
    reps_max: int
    rest_seconds: int
    notes: str


class WorkoutDay(BaseModel):
    day_name: str
    focus: str
    exercises: list[ExerciseInPlan]


class WorkoutPlan(BaseModel):
    plan_name: str
    description: str
    days_per_week: int
    days: list[WorkoutDay]
    methodology_notes: str
    warnings: list[str]


SYSTEM_PROMPT = """\
你是一个专业的训练计划编排助手。你的所有建议必须基于知识库中的数据，不允许编造动作或方法论。

工作流程：
1. 先调用 search_methodology 工具检索相关的训练方法论（容量标记、周期化、恢复、渐进超负荷）。
2. 再调用 search_exercises 工具搜索适合的动作，按目标肌群和可用器械筛选。
3. 基于检索到的方法论原则和动作，编排训练计划。

关键规则：
- 只使用 search_exercises 返回的动作，exercise_id 必须来自搜索结果。
- 每个训练日的动作数量控制在 4-8 个。
- 复合动作放在每天训练的前半部分。
- 组数和次数必须符合方法论中的容量推荐。
- 根据用户画像（训练目标、经验、频率、时长、器械、伤病）定制计划。
- warnings 字段中列出任何需要用户注意的事项（如伤病相关提醒）。"""

workout_agent = Agent(
    "test",  # placeholder, overridden at runtime
    deps_type=AgentDeps,
    output_type=WorkoutPlan,
    system_prompt=SYSTEM_PROMPT,
    retries=3,
)


@workout_agent.tool
async def tool_search_exercises(
    ctx: RunContext[AgentDeps],
    muscle_group: str,
    equipment: str | None = None,
) -> list[dict]:
    """Search the exercise database by muscle group and optional equipment filter.
    muscle_group: one of chest, back, legs, shoulders, arms, core.
    equipment: one of barbell, dumbbell, cable, machine, bodyweight, band. Or None for all."""
    async with ctx.deps.session_factory() as session:
        return await search_exercises(
            session, muscle_group=muscle_group, equipment=equipment
        )


@workout_agent.tool
async def tool_search_methodology(
    ctx: RunContext[AgentDeps],
    query: str,
) -> list[dict]:
    """Search training methodology knowledge base. Use queries like
    '训练容量标记', '周期化原则', '肌肉恢复', '渐进超负荷' etc."""
    return await search_methodology(query)


@workout_agent.tool
async def tool_get_workout_history(
    ctx: RunContext[AgentDeps],
    exercise_name: str,
) -> dict:
    """Get recent workout history and progression suggestion for an exercise.
    Use this to check the user's last performance and suggest weight adjustments."""
    from app.tools.workout_history import get_exercise_history, suggest_progression

    user_id = ctx.deps.user_profile.get("id")
    if not user_id:
        return {"history": [], "progression": {"suggestion": "无用户ID，无法查询历史", "action": "skip"}}

    import uuid
    async with ctx.deps.session_factory() as session:
        history = await get_exercise_history(
            session, uuid.UUID(user_id), exercise_name=exercise_name
        )
    progression = suggest_progression(history)
    return {"history": history[:5], "progression": progression}
