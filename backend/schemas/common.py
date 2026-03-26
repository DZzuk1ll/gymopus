from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int


class ErrorResponse(BaseModel):
    detail: str
    code: str | None = None


class AlertBrief(BaseModel):
    id: str
    title: str
    severity: str  # info / warning / danger
    trigger_type: str  # rule / ai
