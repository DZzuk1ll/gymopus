from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class SignalDetail(BaseModel):
    id: str
    description: str
    value: str
    trend: Literal["up", "down", "neutral"] | None = None

    model_config = {"from_attributes": True}


class ReferenceDetail(BaseModel):
    source: str
    section: str | None = None
    summary: str

    model_config = {"from_attributes": True}


class SuggestionBrief(BaseModel):
    id: str
    title: str
    severity: str
    trigger_type: str
    status: str = "pending"
    created_at: str | None = None

    model_config = {"from_attributes": True}


class SuggestionDetail(BaseModel):
    id: str
    title: str
    severity: str
    trigger_type: str
    status: str = "pending"
    created_at: str | None = None
    signals: list[SignalDetail] = Field(default_factory=list)
    analysis: str
    recommendations: list[str] = Field(default_factory=list)
    alternatives: list[str] = Field(default_factory=list)
    references: list[ReferenceDetail] = Field(default_factory=list)
    confidence: float | None = None
    user_feedback: str | None = None

    model_config = {"from_attributes": True}


class SuggestionStatusUpdate(BaseModel):
    status: Literal["adopted", "ignored", "deferred"]
    feedback: str | None = None


class TriggerAnalysisRequest(BaseModel):
    user_id: str
    scope: Literal["full", "training", "nutrition", "recovery"] = "full"


class TriggerAnalysisResponse(BaseModel):
    triggered: bool
    new_suggestions: list[SuggestionBrief] = Field(default_factory=list)
    message: str
