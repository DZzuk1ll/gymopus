from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.trends import TrendsResponse
from services.trend_service import get_trends

router = APIRouter(prefix="/api/v1/trends", tags=["trends"])


@router.get("/{user_id}", response_model=TrendsResponse)
async def get_user_trends(
    user_id: str,
    range: int = Query(default=30, alias="range"),
    dimensions: str = Query(default="all"),
    db: AsyncSession = Depends(get_db),
):
    return await get_trends(db, user_id, range_days=range, dimensions=dimensions)
