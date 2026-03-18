import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.exercise import Exercise
from app.models.food import Food
from app.schemas import ApiResponse
from app.schemas.exercise import ExerciseResponse
from app.schemas.food import FoodResponse

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


@router.get("/exercises")
async def list_exercises(
    muscle_group: str | None = Query(None),
    equipment: str | None = Query(None),
    movement_pattern: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[list[ExerciseResponse]]:
    stmt = select(Exercise)
    if muscle_group:
        stmt = stmt.where(Exercise.primary_muscle_group == muscle_group)
    if equipment:
        stmt = stmt.where(Exercise.equipment == equipment)
    if movement_pattern:
        stmt = stmt.where(Exercise.movement_pattern == movement_pattern)
    stmt = stmt.order_by(Exercise.primary_muscle_group, Exercise.name_en)
    result = await db.execute(stmt)
    exercises = result.scalars().all()
    return ApiResponse.ok(
        [ExerciseResponse.model_validate(ex) for ex in exercises]
    )


@router.get("/exercises/{exercise_id}")
async def get_exercise(
    exercise_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[ExerciseResponse]:
    result = await db.execute(
        select(Exercise).where(Exercise.id == exercise_id)
    )
    exercise = result.scalar_one_or_none()
    if exercise is None:
        return ApiResponse.fail("Exercise not found")
    return ApiResponse.ok(ExerciseResponse.model_validate(exercise))


@router.get("/foods")
async def list_foods(
    name: str | None = Query(None),
    category: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[list[FoodResponse]]:
    stmt = select(Food)
    if name:
        stmt = stmt.where(Food.name_zh.ilike(f"%{name}%"))
    if category:
        stmt = stmt.where(Food.category == category)
    stmt = stmt.order_by(Food.category, Food.name_zh).limit(50)
    result = await db.execute(stmt)
    foods = result.scalars().all()
    return ApiResponse.ok([FoodResponse.model_validate(f) for f in foods])


@router.get("/foods/{food_id}")
async def get_food(
    food_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[FoodResponse]:
    result = await db.execute(select(Food).where(Food.id == food_id))
    food = result.scalar_one_or_none()
    if food is None:
        return ApiResponse.fail("Food not found")
    return ApiResponse.ok(FoodResponse.model_validate(food))
