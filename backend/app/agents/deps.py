from dataclasses import dataclass

from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.api.deps import LLMConfig


@dataclass
class AgentDeps:
    session_factory: async_sessionmaker
    user_profile: dict


def create_model(llm_config: LLMConfig) -> OpenAIChatModel:
    return OpenAIChatModel(
        llm_config.model,
        provider=OpenAIProvider(
            base_url=llm_config.base_url,
            api_key=llm_config.api_key,
        ),
    )
