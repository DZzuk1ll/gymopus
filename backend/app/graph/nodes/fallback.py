from langchain_core.messages import AIMessage

from app.graph.state import GymOpusState


async def fallback(state: GymOpusState) -> dict:
    validation = state.get("validation_result", {})
    errors = validation.get("errors", [])

    if errors:
        response = "抱歉，生成的训练计划未能通过校验。请尝试重新描述你的需求，我会再次为你生成。"
    else:
        response = (
            "你好！我是 GymOpus 健身助手。我可以帮你：\n"
            "- 制定个性化的训练计划\n"
            "- 生成饮食计划和食谱推荐\n"
            "- 分析你的饮食营养摄入\n"
            "- 追踪体重、睡眠、疲劳等身体状态\n"
            "- 回答健身和营养相关的知识问题\n\n"
            "试试告诉我你的训练目标吧！"
        )

    return {
        "response": response,
        "messages": [AIMessage(content=response)],
    }
