from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class DataPoint(BaseModel):
    date: str
    value: float | None = None


class TrainingTrend(BaseModel):
    daily_volume: list[DataPoint] = Field(default_factory=list)
    weekly_volume: list[DataPoint] = Field(default_factory=list)
    weekly_volume_target: float | None = None


class NutritionTrend(BaseModel):
    daily_calories: list[DataPoint] = Field(default_factory=list)
    daily_protein: list[DataPoint] = Field(default_factory=list)
    targets: dict[str, float] = Field(default_factory=dict)


class SleepTrend(BaseModel):
    daily_duration: list[DataPoint] = Field(default_factory=list)
    daily_quality: list[DataPoint] = Field(default_factory=list)
    target_duration: float = 8.0


class MoodTrend(BaseModel):
    daily_level: list[DataPoint] = Field(default_factory=list)


class BodyTrend(BaseModel):
    daily_weight: list[DataPoint] = Field(default_factory=list)
    target_weight: float | None = None


class CycleAnnotation(BaseModel):
    date: str
    event: str
    type: Literal["cycle", "adjustment", "deload", "current"]


class TrendsResponse(BaseModel):
    range_days: int
    start_date: str
    end_date: str
    training: TrainingTrend | None = None
    body: BodyTrend | None = None
    nutrition: NutritionTrend | None = None
    sleep: SleepTrend | None = None
    mood: MoodTrend | None = None
    cycle_annotations: list[CycleAnnotation] = Field(default_factory=list)
