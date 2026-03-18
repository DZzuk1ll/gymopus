from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.food import Food


async def search_foods(
    session: AsyncSession,
    name: str | None = None,
    category: str | None = None,
    limit: int = 10,
) -> list[dict]:
    """Search Food table by name (ILIKE) and/or category."""
    stmt = select(Food)
    if name:
        stmt = stmt.where(Food.name_zh.ilike(f"%{name}%"))
    if category:
        stmt = stmt.where(Food.category == category)
    stmt = stmt.limit(limit)
    result = await session.execute(stmt)
    foods = result.scalars().all()
    return [
        {
            "food_id": str(f.id),
            "name_zh": f.name_zh,
            "name_en": f.name_en,
            "category": f.category,
            "calories_kcal": f.calories_kcal,
            "protein_g": f.protein_g,
            "fat_g": f.fat_g,
            "carbs_g": f.carbs_g,
            "fiber_g": f.fiber_g,
            "common_portion_desc": f.common_portion_desc,
            "common_portion_g": f.common_portion_g,
        }
        for f in foods
    ]
