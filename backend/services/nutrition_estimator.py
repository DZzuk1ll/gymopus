from __future__ import annotations

import logging
from pathlib import Path

from jinja2 import Environment, FileSystemLoader
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.user import User, UserAIConfig
from schemas.checkin import MealSubmit
from services.ai_integration import ai_client
from utils.llm_json import parse_llm_json

logger = logging.getLogger(__name__)

_env = Environment(
    loader=FileSystemLoader(str(Path(__file__).parent.parent / "prompts")),
    autoescape=False,
)


class MealEstimate(BaseModel):
    meal_index: int = Field(ge=1)
    calories: int | None = Field(default=None, ge=0)
    protein: float | None = Field(default=None, ge=0)
    carbs: float | None = Field(default=None, ge=0)
    fat: float | None = Field(default=None, ge=0)


class MealEstimateResponse(BaseModel):
    meals: list[MealEstimate] = Field(default_factory=list)


def _meal_text(meal: MealSubmit) -> str:
    texts = []
    for item in meal.items:
        if isinstance(item, dict):
            name = str(item.get("name", "")).strip()
            if name:
                texts.append(name)
    return "；".join(texts)


async def estimate_meal_nutrition(
    db: AsyncSession,
    user_id: str,
    meals: list[MealSubmit],
) -> dict[int, dict[str, int | float | None]]:
    if not meals:
        return {}

    user = await db.get(User, user_id)
    if not user:
        return {}

    result = await db.execute(
        select(UserAIConfig).where(
            UserAIConfig.user_id == user_id,
            UserAIConfig.is_active == True,  # noqa: E712
        )
    )
    ai_config = result.scalar_one_or_none()
    if not ai_config:
        return {}

    meal_inputs = []
    for idx, meal in enumerate(meals, start=1):
        description = _meal_text(meal)
        if not description:
            continue
        meal_inputs.append({
            "meal_index": idx,
            "meal_name": meal.meal_name,
            "description": description,
        })

    if not meal_inputs:
        return {}

    template = _env.get_template("nutrition_estimation.j2")
    prompt = template.render(
        user_context={
            "gender": user.gender or "unknown",
            "age": user.age,
            "weight_kg": user.weight_kg,
            "training_goal": user.training_goal or "maintain",
        },
        meals=meal_inputs,
    )

    try:
        response_text = await ai_client.complete(
            provider=ai_config.provider,
            model=ai_config.model,
            api_key_enc=ai_config.api_key_enc,
            base_url=ai_config.base_url,
            messages=[
                {
                    "role": "system",
                    "content": "你是营养记录助手。根据常见食物与分量估算每餐总热量和三大营养素，只返回 JSON。",
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=ai_config.max_tokens,
        )
        parsed = parse_llm_json(response_text, context="Nutrition estimation response")
        validated = MealEstimateResponse.model_validate(parsed)
    except Exception as exc:
        logger.warning("Nutrition estimation failed for user %s: %s", user_id, exc)
        return {}

    return {
        meal.meal_index: {
            "calories": meal.calories,
            "protein": meal.protein,
            "carbs": meal.carbs,
            "fat": meal.fat,
        }
        for meal in validated.meals
    }
