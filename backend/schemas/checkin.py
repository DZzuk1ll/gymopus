from __future__ import annotations

from pydantic import BaseModel, Field

from schemas.common import AlertBrief


class SetSubmit(BaseModel):
    set_number: int
    target_reps: int | None = None
    target_weight: float | None = None
    actual_reps: int | None = None
    actual_weight: float | None = None
    rpe: float | None = None


class ExerciseSubmit(BaseModel):
    plan_exercise_id: str | None = None
    exercise_name: str
    sets: list[SetSubmit]


class TrainingSubmit(BaseModel):
    plan_day_id: str | None = None
    duration_min: int | None = None
    overall_rpe: float | None = None
    exercises: list[ExerciseSubmit]


class MealSubmit(BaseModel):
    meal_name: str
    items: list[dict] = Field(default_factory=list)
    calories: int | None = None
    protein: float | None = None
    carbs: float | None = None
    fat: float | None = None
    time: str | None = None


class NutritionSubmit(BaseModel):
    meals: list[MealSubmit]
    water_ml: int | None = None


class SleepSubmit(BaseModel):
    bed_time: str | None = None
    wake_time: str | None = None
    duration_hours: float | None = None
    quality_score: int | None = Field(default=None, ge=1, le=10)
    deep_sleep_pct: float | None = None


class SupplementItem(BaseModel):
    name: str
    dosage: str
    time: str
    taken: bool


class SupplementSubmit(BaseModel):
    items: list[SupplementItem]


class MoodSubmit(BaseModel):
    level: int = Field(ge=1, le=5)
    description: str | None = None
    energy_level: int | None = Field(default=None, ge=1, le=5)
    stress_level: int | None = Field(default=None, ge=1, le=5)


class BodyMetricsSubmit(BaseModel):
    weight_kg: float | None = None
    body_fat_pct: float | None = None
    chest_cm: float | None = None
    waist_cm: float | None = None
    arm_cm: float | None = None


class CheckinSubmit(BaseModel):
    user_id: str
    date: str  # YYYY-MM-DD
    training: TrainingSubmit | None = None
    nutrition: NutritionSubmit | None = None
    sleep: SleepSubmit | None = None
    supplements: SupplementSubmit | None = None
    mood: MoodSubmit | None = None
    body_metrics: BodyMetricsSubmit | None = None
    notes: str | None = None


class CheckinResponse(BaseModel):
    checkin_id: str
    date: str
    completed_modules: list[str]
    alerts: list[AlertBrief] = Field(default_factory=list)


# --- Detail response schemas ---

class SetLogResponse(BaseModel):
    id: str
    set_number: int
    target_reps: int | None = None
    target_weight: float | None = None
    actual_reps: int | None = None
    actual_weight: float | None = None
    rpe: float | None = None

    model_config = {"from_attributes": True}


class ExerciseLogResponse(BaseModel):
    id: str
    exercise_name: str
    order_index: int
    plan_exercise_id: str | None = None
    sets: list[SetLogResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class TrainingLogResponse(BaseModel):
    plan_day_id: str | None = None
    total_volume_kg: float | None = None
    total_sets: int | None = None
    duration_min: int | None = None
    overall_rpe: float | None = None
    exercises: list[ExerciseLogResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class MealLogResponse(BaseModel):
    meal_name: str
    items: list[dict] = Field(default_factory=list)
    calories: int | None = None
    protein: float | None = None
    carbs: float | None = None
    fat: float | None = None
    time: str | None = None

    model_config = {"from_attributes": True}


class NutritionLogResponse(BaseModel):
    total_calories: int | None = None
    total_protein: float | None = None
    total_carbs: float | None = None
    total_fat: float | None = None
    water_ml: int | None = None
    meals: list[MealLogResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class SleepLogResponse(BaseModel):
    bed_time: str | None = None
    wake_time: str | None = None
    duration_hours: float | None = None
    quality_score: int | None = None
    deep_sleep_pct: float | None = None

    model_config = {"from_attributes": True}


class SupplementLogResponse(BaseModel):
    items: list[dict] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class MoodLogResponse(BaseModel):
    level: int
    description: str | None = None
    energy_level: int | None = None
    stress_level: int | None = None

    model_config = {"from_attributes": True}


class BodyMetricsLogResponse(BaseModel):
    weight_kg: float | None = None
    body_fat_pct: float | None = None
    chest_cm: float | None = None
    waist_cm: float | None = None
    arm_cm: float | None = None

    model_config = {"from_attributes": True}


class CheckinDetailResponse(BaseModel):
    id: str
    date: str
    completed_modules: list[str] = Field(default_factory=list)
    notes: str | None = None
    training: TrainingLogResponse | None = None
    nutrition: NutritionLogResponse | None = None
    sleep: SleepLogResponse | None = None
    supplements: SupplementLogResponse | None = None
    mood: MoodLogResponse | None = None
    body_metrics: BodyMetricsLogResponse | None = None
    created_at: str | None = None

    model_config = {"from_attributes": True}
