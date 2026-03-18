from pydantic import BaseModel
from pydantic_ai import Agent


class WeeklyReport(BaseModel):
    training_summary: str
    diet_summary: str
    status_summary: str
    achievements: list[str]
    concerns: list[str]
    recommendations: list[str]


SYSTEM_PROMPT = """\
你是一个健身周报生成助手。你会收到用户一周的预计算数据，包括训练记录、饮食记录和身体状态趋势。

你的任务是：
1. 用中文总结一周的训练情况（training_summary）。
2. 总结饮食情况（diet_summary）。
3. 总结身体状态趋势（status_summary）。
4. 列出本周的成就亮点（achievements）。
5. 指出需要关注的问题（concerns）。
6. 给出 2-4 条具体建议（recommendations）。

规则：
- 所有总结必须基于提供的数据，不编造信息。
- 如果某类数据缺失，如实说明"本周未记录XX数据"。
- 语言简洁、鼓励性强、专业。
- 建议要具体可操作，不要空泛。"""

report_agent = Agent(
    "test",  # placeholder, overridden at runtime
    output_type=WeeklyReport,
    system_prompt=SYSTEM_PROMPT,
    retries=2,
)
