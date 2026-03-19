import asyncio
import json
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from sqlalchemy import select
from app.database import async_session
from app.models.exercise import Exercise


async def seed():
    json_path = (
        Path(__file__).resolve().parent.parent
        / "knowledge-base"
        / "exercises"
        / "exercises.json"
    )
    with open(json_path) as f:
        exercises = json.load(f)

    async with async_session() as session:
        added = 0
        for ex in exercises:
            # Upsert by name_en to support incremental updates
            result = await session.execute(
                select(Exercise).where(Exercise.name_en == ex["name_en"])
            )
            existing = result.scalar_one_or_none()
            if existing:
                # Update existing fields
                for key, value in ex.items():
                    setattr(existing, key, value)
            else:
                session.add(Exercise(**ex))
                added += 1
        await session.commit()
        print(f"Seeded exercises: {added} new, {len(exercises) - added} updated (total: {len(exercises)}).")


if __name__ == "__main__":
    asyncio.run(seed())
