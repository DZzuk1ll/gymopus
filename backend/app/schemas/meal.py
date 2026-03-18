import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict


class MealFoodItem(BaseModel):
    food_id: str | None = None
    name: str
    portion_g: float
    calories: float
    protein: float
    fat: float
    carbs: float


class MacroTotals(BaseModel):
    calories: float
    protein_g: float
    fat_g: float
    carbs_g: float


class Meal(BaseModel):
    meal_name: str
    foods: list[MealFoodItem]


class MealPlanResponse(BaseModel):
    plan_name: str
    target: MacroTotals
    total: MacroTotals
    meals: list[Meal]
    notes: str
    warnings: list[str]


class MealLogCreate(BaseModel):
    logged_date: date
    meal_type: str  # breakfast/lunch/dinner/snack
    raw_description: str


class MealLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    logged_date: date
    meal_type: str
    raw_description: str
    parsed_foods: dict | None = None
    total_calories: float | None = None
    total_protein: float | None = None
    total_fat: float | None = None
    total_carbs: float | None = None
    analysis_notes: str | None = None


class DietAnalysisResponse(BaseModel):
    parsed_foods: list[MealFoodItem]
    totals: MacroTotals
    targets: MacroTotals | None = None
    diffs: MacroTotals | None = None
    assessment: str
    suggestions: list[str]
    confidence: str
