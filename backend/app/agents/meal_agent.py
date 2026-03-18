from pydantic import BaseModel
from pydantic_ai import Agent, RunContext

from app.agents.deps import AgentDeps
from app.tools.food_lookup import search_foods
from app.tools.nutrition_calc import calc_food_nutrition, calc_user_targets


class MealFoodInPlan(BaseModel):
    food_id: str | None = None
    name: str
    portion_g: float
    calories: float
    protein: float
    fat: float
    carbs: float


class MealInPlan(BaseModel):
    meal_name: str  # 早餐/午餐/晚餐/加餐
    foods: list[MealFoodInPlan]


class MacroTargets(BaseModel):
    calories: float
    protein_g: float
    fat_g: float
    carbs_g: float


class MealPlan(BaseModel):
    plan_name: str
    target: MacroTargets
    total: MacroTargets
    meals: list[MealInPlan]
    notes: str
    warnings: list[str]


SYSTEM_PROMPT = """\
你是一个专业的饮食计划助手。你的所有建议必须基于食物成分表中的真实数据，不允许编造食物营养信息。

工作流程：
1. 先根据用户画像调用 calc_targets 工具计算每日热量和宏量目标（TDEE）。
2. 调用 search_foods 工具搜索食物成分表，获取真实营养数据。
3. 基于搜索到的食物数据编排饮食计划，确保总热量和宏量接近目标。

关键规则：
- 只使用 search_foods 返回的食物，food_id 必须来自搜索结果。
- 每餐 portion_g 是实际食用克数，calories/protein/fat/carbs 按比例换算（食物数据库是每100g）。
- 一日三餐 + 可选加餐。
- total 字段必须是所有 meals 中食物的实际汇总，数学必须一致。
- warnings 中列出饮食注意事项（如过敏、偏好冲突）。
- 回复使用中文。"""

meal_agent = Agent(
    "test",  # placeholder, overridden at runtime
    deps_type=AgentDeps,
    output_type=MealPlan,
    system_prompt=SYSTEM_PROMPT,
    retries=3,
)


@meal_agent.tool
async def tool_calc_targets(
    ctx: RunContext[AgentDeps],
) -> dict:
    """Calculate daily calorie and macro targets based on user profile.
    Call this first to determine TDEE and macro split."""
    return calc_user_targets(ctx.deps.user_profile)


@meal_agent.tool
async def tool_search_foods(
    ctx: RunContext[AgentDeps],
    name: str | None = None,
    category: str | None = None,
) -> list[dict]:
    """Search the food composition database.
    name: Chinese food name (partial match), e.g. '鸡胸', '米饭'.
    category: one of grain/protein/vegetable/fruit/dairy/oil/dish/snack/beverage. Or None for all."""
    async with ctx.deps.session_factory() as session:
        return await search_foods(session, name=name, category=category)
