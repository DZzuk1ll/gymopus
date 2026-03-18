import uuid

from fastapi import Depends, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from pydantic import BaseModel

from app.database import get_db
from app.config import get_config
from app.models.user import User


class LLMConfig(BaseModel):
    base_url: str
    api_key: str
    model: str
    is_default: bool = True


async def get_current_user(
    x_anonymous_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
) -> User:
    user_uuid = uuid.UUID(x_anonymous_id)
    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(id=user_uuid)
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user


async def get_llm_config(
    x_llm_base_url: str | None = Header(None),
    x_llm_api_key: str | None = Header(None),
    x_llm_model: str | None = Header(None),
) -> LLMConfig:
    if x_llm_base_url and x_llm_api_key and x_llm_model:
        return LLMConfig(
            base_url=x_llm_base_url,
            api_key=x_llm_api_key,
            model=x_llm_model,
            is_default=False,
        )
    config = get_config()
    return LLMConfig(
        base_url=config.default_llm.base_url,
        api_key=config.default_llm.api_key,
        model=config.default_llm.model,
        is_default=True,
    )
