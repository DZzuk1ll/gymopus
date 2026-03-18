from typing import Literal

from pydantic import BaseModel
from pydantic_ai import Agent, RunContext

from app.agents.deps import AgentDeps
from app.tools.methodology_search import search_methodology
from app.tools.nutrition_search import search_nutrition_guidelines


class QAResult(BaseModel):
    answer: str
    sources: list[str]
    confidence: Literal["high", "medium", "low"]


SYSTEM_PROMPT = """\
你是一个健身和营养知识问答助手。你只能基于工具检索到的知识库内容来回答问题。

规则：
- 训练相关问题：调用 search_methodology 搜索训练方法论知识库。
- 营养/饮食相关问题：调用 search_nutrition 搜索营养指南知识库。
- 综合问题可以同时调用两个工具。
- 只基于检索到的内容回答，不要编造信息。
- 在 sources 中列出引用的文档来源。
- 如果检索结果中没有相关内容，诚实回答"知识库中没有找到相关信息"，并将 confidence 设为 low。
- 回答使用中文，语言简洁专业。"""

qa_agent = Agent(
    "test",  # placeholder, overridden at runtime
    deps_type=AgentDeps,
    output_type=QAResult,
    system_prompt=SYSTEM_PROMPT,
    retries=2,
)


@qa_agent.tool
async def tool_search_methodology(
    ctx: RunContext[AgentDeps],
    query: str,
) -> list[dict]:
    """Search the training methodology knowledge base for relevant information.
    Use for questions about training volume, periodization, recovery, progressive overload, etc."""
    return await search_methodology(query)


@qa_agent.tool
async def tool_search_nutrition(
    ctx: RunContext[AgentDeps],
    query: str,
) -> list[dict]:
    """Search the nutrition guidelines knowledge base for relevant information.
    Use for questions about dietary guidelines, protein recommendations, macro split, etc."""
    return await search_nutrition_guidelines(query)
