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
        # Check if already seeded
        result = await session.execute(select(Exercise).limit(1))
        if result.scalar_one_or_none():
            print("Exercises already seeded, skipping.")
            return

        for ex in exercises:
            session.add(Exercise(**ex))
        await session.commit()
        print(f"Seeded {len(exercises)} exercises.")


if __name__ == "__main__":
    asyncio.run(seed())
