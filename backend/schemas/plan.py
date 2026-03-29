from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class PlanGenerateRequest(BaseModel):
    user_id: str
    goal: Literal["muscle", "fat-loss", "strength", "maintain"]
    experience: str
    split_type: Literal["ppl", "upper-lower", "full-body", "bro-split"]
    days_per_week: int = Field(ge=2, le=7)
    minutes_per_session: int = Field(ge=30, le=180)
    equipment: Literal["commercial", "home", "custom"]
    custom_description: str | None = None  # 用户自然语言描述训练偏好/器械
    height_cm: float | None = None
    weight_kg: float | None = None
    age: int | None = None
    gender: str | None = None
    body_fat_pct: float | None = None
    injuries: str | None = None
    diet_goal: Literal["surplus", "deficit", "maintain"] = "maintain"
    restrictions: list[str] = Field(default_factory=list)
    meals_per_day: int = Field(default=4, ge=2, le=8)


class ExerciseUpdate(BaseModel):
    exercise_name: str | None = None
    exercise_name_en: str | None = None
    sets: int | None = None
    reps_range: str | None = None
    target_weight: str | None = None
    target_rpe: float | None = None
    rest_seconds: int | None = None
    notes: str | None = None


class ExerciseCreate(BaseModel):
    day_id: str
    exercise_name: str
    exercise_name_en: str | None = None
    sets: int = 3
    reps_range: str = "8-12"
    target_weight: str | None = None
    target_rpe: float | None = None
    rest_seconds: int | None = None
    notes: str | None = None


class PlanSummary(BaseModel):
    total_weeks: int
    split_type: str
    days_per_week: int
    minutes_per_session: int
    periodization_model: str | None = None


class NutritionTargets(BaseModel):
    calories: int
    protein_g: int
    carbs_g: int
    fat_g: int


class KnowledgeRefBrief(BaseModel):
    id: str
    source: str
    section: str | None = None
    title: str


class PlanExerciseDetail(BaseModel):
    id: str
    order_index: int
    exercise_name: str
    exercise_name_en: str | None = None
    sets: int
    reps_range: str
    target_weight: str | None = None
    target_rpe: float | None = None
    rest_seconds: int | None = None
    notes: str | None = None
    superset_group: str | None = None

    model_config = {"from_attributes": True}


class PlanDayDetail(BaseModel):
    id: str
    day_of_week: int
    day_type: str
    label: str | None = None
    target_muscles: list[str] = Field(default_factory=list)
    estimated_duration: int | None = None
    notes: str | None = None
    exercises: list[PlanExerciseDetail] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class WeekDetail(BaseModel):
    id: str
    week_number: int
    theme: str | None = None
    volume_target: float | None = None
    intensity_modifier: float = 1.0
    notes: str | None = None
    days: list[PlanDayDetail] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class WeekSummary(BaseModel):
    id: str
    week_number: int
    theme: str | None = None
    intensity_modifier: float = 1.0
    days_count: int = 0

    model_config = {"from_attributes": True}


class PlanResponse(BaseModel):
    id: str
    name: str
    goal: str
    split_type: str
    days_per_week: int
    minutes_per_session: int
    equipment: str
    total_weeks: int
    current_week: int = 1
    status: str = "active"
    diet_goal: str | None = None
    target_calories: int | None = None
    target_protein: int | None = None
    target_carbs: int | None = None
    target_fat: int | None = None
    meals_per_day: int | None = None
    diet_restrictions: list[str] = Field(default_factory=list)
    created_at: str | None = None

    model_config = {"from_attributes": True}


class PlanDetailResponse(PlanResponse):
    weeks: list[WeekDetail] = Field(default_factory=list)
    knowledge_refs: list[KnowledgeRefBrief] = Field(default_factory=list)


class PlanGenerateResponse(BaseModel):
    plan_id: str
    name: str
    summary: PlanSummary
    nutrition_targets: NutritionTargets
    weeks: list[WeekSummary] = Field(default_factory=list)
    knowledge_refs: list[KnowledgeRefBrief] = Field(default_factory=list)
    disclaimer: str


class PlanUpdate(BaseModel):
    status: Literal["active", "completed", "paused"] | None = None
    current_week: int | None = None
    name: str | None = None


class TodayWorkoutResponse(BaseModel):
    plan_day: PlanDayDetail | None = None
    is_rest_day: bool = True
    week_number: int = 1
    day_of_week: int = 1
