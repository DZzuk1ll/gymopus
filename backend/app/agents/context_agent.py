import uuid

from pydantic import BaseModel
from pydantic_ai import Agent, RunContext

from app.agents.deps import AgentDeps
from app.tools.methodology_search import search_methodology
from app.tools.nutrition_search import search_nutrition_guidelines
from app.tools.user_data_queries import (
    query_training_data,
    query_diet_data,
    query_body_status,
    query_user_profile,
)


class AnalysisResult(BaseModel):
    summary: str
    insights: list[str]
    concerns: list[str]
    recommendations: list[str]


SYSTEM_PROMPT = """\
你是一个健身数据分析助手。你可以查看用户的个人记录和身体状态，也可以查询专业知识库。

你有两类工具：
1. **用户数据工具**（查看用户的个人记录和状态）：
   - get_training_data：获取当前训练计划和最近7天训练记录
   - get_diet_data：获取最近7天饮食记录和每日宏量营养素汇总
   - get_body_status：获取7天身体状态（体重趋势、睡眠、疲劳、压力、情绪）
   - get_user_profile：获取用户基础信息、目标、器械、伤病

2. **知识库工具**（查询健身/营养专业知识）：
   - search_methodology：搜索训练方法论
   - search_nutrition：搜索营养指南

工作流程：
1. 根据用户的问题，先调用相关的数据查询工具获取用户数据。
2. 如需专业知识辅助分析，调用知识库工具。
3. 基于数据和知识给出结构化分析。

规则：
- 分析必须基于实际数据，不要编造数据。
- 如果数据不足，诚实说明。
- 建议要具体可执行，不要空泛。
- 回答使用中文。"""

context_agent = Agent(
    "test",  # placeholder, overridden at runtime
    deps_type=AgentDeps,
    output_type=AnalysisResult,
    system_prompt=SYSTEM_PROMPT,
    retries=2,
)


@context_agent.tool
async def get_training_data(ctx: RunContext[AgentDeps]) -> dict:
    """Get the user's active training plan and last 7 days workout logs.
    Use this to understand what the user has been training recently."""
    user_id = ctx.deps.user_profile.get("id")
    if not user_id:
        return {"error": "无用户ID"}
    async with ctx.deps.session_factory() as session:
        return await query_training_data(session, uuid.UUID(user_id))


@context_agent.tool
async def get_diet_data(ctx: RunContext[AgentDeps]) -> dict:
    """Get the user's last 7 days meal logs with daily macro summaries.
    Use this to understand the user's recent nutrition intake."""
    user_id = ctx.deps.user_profile.get("id")
    if not user_id:
        return {"error": "无用户ID"}
    async with ctx.deps.session_factory() as session:
        return await query_diet_data(session, uuid.UUID(user_id))


@context_agent.tool
async def get_body_status(ctx: RunContext[AgentDeps]) -> dict:
    """Get the user's 7-day body status including weight trend, sleep, fatigue, stress, mood.
    Use this to understand the user's recovery and overall condition."""
    user_id = ctx.deps.user_profile.get("id")
    if not user_id:
        return {"error": "无用户ID"}
    async with ctx.deps.session_factory() as session:
        return await query_body_status(session, uuid.UUID(user_id))


@context_agent.tool
async def get_user_profile(ctx: RunContext[AgentDeps]) -> dict:
    """Get the user's basic profile: demographics, goals, equipment, injuries.
    Use this to understand the user's context for personalized advice."""
    user_id = ctx.deps.user_profile.get("id")
    if not user_id:
        return {"error": "无用户ID"}
    async with ctx.deps.session_factory() as session:
        return await query_user_profile(session, uuid.UUID(user_id))


@context_agent.tool
async def tool_search_methodology(
    ctx: RunContext[AgentDeps],
    query: str,
) -> list[dict]:
    """Search the training methodology knowledge base.
    Use for professional training principles to support your analysis."""
    return await search_methodology(query)


@context_agent.tool
async def tool_search_nutrition(
    ctx: RunContext[AgentDeps],
    query: str,
) -> list[dict]:
    """Search the nutrition guidelines knowledge base.
    Use for professional nutrition principles to support your analysis."""
    return await search_nutrition_guidelines(query)
