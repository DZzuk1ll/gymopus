from datetime import date, timezone, datetime

from fastapi import Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.config import get_config
from app.api.deps import get_current_user, get_llm_config, LLMConfig
from app.models.user import User
from app.models.rate_limit import RateLimitCounter


async def check_rate_limit(
    user: User = Depends(get_current_user),
    llm_config: LLMConfig = Depends(get_llm_config),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Rate limit dependency for LLM-invoking endpoints. Only limits default-mode users."""
    if not llm_config.is_default:
        return

    config = get_config()
    today = datetime.now(timezone.utc).date()

    result = await db.execute(
        select(RateLimitCounter).where(
            RateLimitCounter.user_id == user.id,
            RateLimitCounter.date == today,
        )
    )
    counter = result.scalar_one_or_none()

    if counter and counter.call_count >= config.app.daily_llm_limit:
        raise HTTPException(
            status_code=429,
            detail="今日使用次数已达上限，配置自己的 API Key 可解除限制",
        )


async def increment_rate_limit(
    user_id, llm_config: LLMConfig, db: AsyncSession
) -> None:
    """Call after a successful LLM invocation to increment the counter."""
    if not llm_config.is_default:
        return

    today = datetime.now(timezone.utc).date()

    result = await db.execute(
        select(RateLimitCounter).where(
            RateLimitCounter.user_id == user_id,
            RateLimitCounter.date == today,
        )
    )
    counter = result.scalar_one_or_none()

    if counter is None:
        counter = RateLimitCounter(user_id=user_id, date=today, call_count=1)
        db.add(counter)
    else:
        counter.call_count += 1

    await db.commit()
