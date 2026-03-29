from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User, UserAIConfig
from schemas.user import (
    AIConfigResponse,
    AIConfigUpdate,
    UserCreate,
    UserResponse,
    UserUpdate,
)
from utils.crypto import encrypt_api_key, mask_api_key

router = APIRouter(prefix="/api/v1/users", tags=["users"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.post("", status_code=201, response_model=UserResponse)
async def create_user(body: UserCreate, db: AsyncSession = Depends(get_db)):
    parq_has_risk = any(body.parq_answers) if body.parq_answers else False
    now = _now()
    user = User(
        name=body.name,
        gender=body.gender,
        age=body.age,
        height_cm=body.height_cm,
        weight_kg=body.weight_kg,
        body_fat_pct=body.body_fat_pct,
        experience=body.experience,
        training_goal=body.training_goal,
        injuries=body.injuries,
        parq_answers=json.dumps(body.parq_answers),
        parq_has_risk=parq_has_risk,
        created_at=now,
        updated_at=now,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, body: UserUpdate, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = body.model_dump(exclude_unset=True)
    if "parq_answers" in update_data and update_data["parq_answers"] is not None:
        user.parq_has_risk = any(update_data["parq_answers"])
        update_data["parq_answers"] = json.dumps(update_data["parq_answers"])

    for k, v in update_data.items():
        setattr(user, k, v)
    user.updated_at = _now()

    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{user_id}")
async def delete_user(user_id: str, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
    await db.commit()
    return {"status": "deleted"}


# --- AI Config ---

@router.put("/{user_id}/ai-config", response_model=AIConfigResponse)
async def upsert_ai_config(user_id: str, body: AIConfigUpdate, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    result = await db.execute(
        select(UserAIConfig).where(
            UserAIConfig.user_id == user_id,
            UserAIConfig.provider == body.provider,
        )
    )
    config = result.scalar_one_or_none()
    now = _now()

    if config:
        config.model = body.model
        if body.api_key:
            config.api_key_enc = encrypt_api_key(body.api_key)
        config.base_url = body.base_url
        config.max_tokens = body.max_tokens
        config.is_active = True
        config.updated_at = now
    else:
        config = UserAIConfig(
            user_id=user_id,
            provider=body.provider,
            model=body.model,
            api_key_enc=encrypt_api_key(body.api_key) if body.api_key else None,
            base_url=body.base_url,
            max_tokens=body.max_tokens,
            is_active=True,
            created_at=now,
            updated_at=now,
        )
        db.add(config)

    await db.commit()
    await db.refresh(config)
    return AIConfigResponse(
        id=config.id,
        provider=config.provider,
        model=config.model,
        api_key_masked=mask_api_key(config.api_key_enc),
        base_url=config.base_url,
        max_tokens=config.max_tokens,
        is_active=config.is_active,
    )


@router.get("/{user_id}/ai-config", response_model=list[AIConfigResponse])
async def get_ai_configs(user_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(UserAIConfig).where(UserAIConfig.user_id == user_id)
    )
    configs = result.scalars().all()
    return [
        AIConfigResponse(
            id=c.id,
            provider=c.provider,
            model=c.model,
            api_key_masked=mask_api_key(c.api_key_enc),
            base_url=c.base_url,
            max_tokens=c.max_tokens,
            is_active=c.is_active,
        )
        for c in configs
    ]


@router.post("/{user_id}/ai-config/test")
async def test_ai_config(user_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(UserAIConfig).where(
            UserAIConfig.user_id == user_id,
            UserAIConfig.is_active == True,  # noqa: E712
        )
    )
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=400, detail="No active AI config found")

    try:
        from litellm import acompletion
        from utils.crypto import decrypt_api_key
        from services.ai_integration import PROVIDER_PREFIX, resolve_custom_prefix

        if config.provider == "custom":
            prefix = resolve_custom_prefix(config.base_url)
        else:
            prefix = PROVIDER_PREFIX.get(config.provider, "")
        model = f"{prefix}{config.model}"

        api_key = decrypt_api_key(config.api_key_enc) if config.api_key_enc else None
        response = await acompletion(
            model=model,
            messages=[{"role": "user", "content": "Hi"}],
            max_tokens=5,
            api_key=api_key,
            api_base=config.base_url,
        )
        return {"status": "ok", "model": config.model}
    except Exception as e:
        return {"status": "failed", "error": str(e)}
