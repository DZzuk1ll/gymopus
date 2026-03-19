"""Read food composition CSV and seed into the Food table (idempotent)."""

import asyncio
import csv
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from sqlalchemy import select, func
from app.database import async_session
from app.models.food import Food

CSV_PATH = Path(__file__).resolve().parent.parent / "knowledge-base" / "foods" / "chinese_food_composition.csv"

FLOAT_FIELDS = [
    "calories_kcal", "protein_g", "fat_g", "carbs_g", "fiber_g",
    "sodium_mg", "potassium_mg", "calcium_mg", "iron_mg",
    "vitamin_a_ug", "vitamin_c_mg", "common_portion_g",
]


def parse_float(value: str) -> float | None:
    if not value or value.strip() in ("", "-", "N/A"):
        return None
    try:
        return float(value.strip())
    except ValueError:
        return None


async def main():
    if not CSV_PATH.exists():
        print(f"CSV not found: {CSV_PATH}")
        print("Run scripts/fetch_food_data.py first to generate the CSV.")
        sys.exit(1)

    with open(CSV_PATH, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    async with async_session() as session:
        added = 0
        updated = 0
        for row in rows:
            name_zh = row["name_zh"].strip()
            # Upsert by name_zh
            result = await session.execute(
                select(Food).where(Food.name_zh == name_zh)
            )
            existing = result.scalar_one_or_none()

            fields = dict(
                name_zh=name_zh,
                name_en=row.get("name_en", "").strip(),
                category=row["category"].strip(),
                calories_kcal=parse_float(row["calories_kcal"]) or 0,
                protein_g=parse_float(row["protein_g"]) or 0,
                fat_g=parse_float(row["fat_g"]) or 0,
                carbs_g=parse_float(row["carbs_g"]) or 0,
                fiber_g=parse_float(row.get("fiber_g", "")),
                sodium_mg=parse_float(row.get("sodium_mg", "")),
                potassium_mg=parse_float(row.get("potassium_mg", "")),
                calcium_mg=parse_float(row.get("calcium_mg", "")),
                iron_mg=parse_float(row.get("iron_mg", "")),
                vitamin_a_ug=parse_float(row.get("vitamin_a_ug", "")),
                vitamin_c_mg=parse_float(row.get("vitamin_c_mg", "")),
                common_portion_desc=row.get("common_portion_desc", "").strip() or None,
                common_portion_g=parse_float(row.get("common_portion_g", "")),
            )

            if existing:
                for key, value in fields.items():
                    setattr(existing, key, value)
                updated += 1
            else:
                session.add(Food(id=uuid.uuid4(), **fields))
                added += 1

        await session.commit()
        print(f"Seeded foods: {added} new, {updated} updated (total: {added + updated})")


if __name__ == "__main__":
    asyncio.run(main())
