from typing import Literal

from pydantic import BaseModel
from pydantic_ai import Agent, RunContext

from app.agents.deps import AgentDeps
from app.tools.food_lookup import search_foods
from app.tools.nutrition_calc import calc_user_targets


class ParsedFood(BaseModel):
    food_id: str | None = None
    name: str
    estimated_portion_g: float
    calories: float
    protein: float
    fat: float
    carbs: float


class MacroTotals(BaseModel):
    calories: float
    protein_g: float
    fat_g: float
    carbs_g: float


class DietAnalysis(BaseModel):
    parsed_foods: list[ParsedFood]
    totals: MacroTotals
    targets: MacroTotals | None = None
    diffs: MacroTotals | None = None
    assessment: str
    suggestions: list[str]
    confidence: Literal["high", "medium", "low"]


SYSTEM_PROMPT = """\
你是一个饮食分析助手。用户会告诉你他们吃了什么，你需要：

工作流程：
1. 调用 calc_targets 获取用户的每日热量/宏量目标。
2. 对用户描述的每种食物，调用 search_foods 在食物成分表中查找匹配。
3. 根据食物成分表数据估算份量和营养素。
4. 汇总并与目标对比，给出评估和建议。

关键规则：
- 尽量将用户描述的食物映射到食物成分表中的条目。
- 如果无法精确匹配，选择最接近的食物，并将 confidence 设为 medium。
- 如果完全无法匹配，诚实标记 confidence=low，不要编造数据。
- calories/protein/fat/carbs 根据 estimated_portion_g 和每100g数据换算。
- diffs 是 totals 与 targets 的差值（正值=超标，负值=不足）。
- assessment 用中文给出简洁评价。
- suggestions 给出 2-4 条具体可操作的饮食建议。"""

diet_agent = Agent(
    "test",  # placeholder, overridden at runtime
    deps_type=AgentDeps,
    output_type=DietAnalysis,
    system_prompt=SYSTEM_PROMPT,
    retries=3,
)


@diet_agent.tool
async def tool_calc_targets(
    ctx: RunContext[AgentDeps],
) -> dict:
    """Calculate daily calorie and macro targets based on user profile."""
    return calc_user_targets(ctx.deps.user_profile)


@diet_agent.tool
async def tool_search_foods(
    ctx: RunContext[AgentDeps],
    name: str,
) -> list[dict]:
    """Search the food composition database by Chinese name (partial match).
    e.g. '黄焖鸡', '米饭', '鸡蛋'."""
    async with ctx.deps.session_factory() as session:
        return await search_foods(session, name=name)
