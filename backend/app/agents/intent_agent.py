from typing import Literal

from pydantic import BaseModel
from pydantic_ai import Agent

from app.agents.deps import AgentDeps


class IntentResult(BaseModel):
    intent: Literal["workout", "meal", "diet_analysis", "analysis", "qa", "chitchat"]
    reasoning: str


SYSTEM_PROMPT = """\
你是一个意图分类器。根据用户消息，判断其意图属于以下类别之一：

- workout：用户想要生成、修改或查看训练计划。例如"帮我制定一个增肌计划"、"调整一下我的腿部训练"。
- meal：用户想要生成饮食计划或食谱推荐。例如"帮我制定增肌饮食计划"、"今天该吃什么"、"给我安排一天的食谱"。
- diet_analysis：用户在描述自己吃了什么，想要营养分析。例如"中午吃了黄焖鸡米饭"、"今天吃了两个鸡蛋和一碗粥"。
- analysis：用户想了解自己的训练/饮食/身体状态，或要求 AI 分析进度。例如"我这周练得怎么样"、"分析一下我最近的饮食"、"我的训练数据怎么样"、"看看我最近的状态"。
- qa：用户在提问健身或营养相关的知识问题。例如"每个肌群每周该做多少组"、"每天应该吃多少蛋白质"。
- chitchat：闲聊、问候、或与健身训练/知识无关的内容。例如"你好"、"今天天气真好"。

只返回分类结果，不要回答用户的问题。"""

intent_agent = Agent(
    "test",  # placeholder, overridden at runtime
    output_type=IntentResult,
    system_prompt=SYSTEM_PROMPT,
)
