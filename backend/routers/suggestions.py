from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models.suggestion import Suggestion, SuggestionReference, SuggestionSignal
from schemas.suggestion import (
    ReferenceDetail,
    SignalDetail,
    SuggestionBrief,
    SuggestionDetail,
    SuggestionStatusUpdate,
    TriggerAnalysisRequest,
    TriggerAnalysisResponse,
)

router = APIRouter(prefix="/api/v1/suggestions", tags=["suggestions"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_json_list(val: str | None) -> list:
    if not val:
        return []
    try:
        return json.loads(val)
    except (json.JSONDecodeError, TypeError):
        return []


@router.post("/trigger", response_model=TriggerAnalysisResponse)
async def trigger_analysis(body: TriggerAnalysisRequest, db: AsyncSession = Depends(get_db)):
    from services.ai_analyzer import analyze_signals
    from services.rule_engine import RuleEngine
    from datetime import date

    engine = RuleEngine()
    today = date.today().isoformat()
    alerts = await engine.evaluate(db, body.user_id, today)

    signals = [
        {"description": a.title, "value": a.severity, "trend": "neutral"}
        for a in alerts
    ]

    if not signals:
        return TriggerAnalysisResponse(
            triggered=False,
            new_suggestions=[],
            message="未检测到需要分析的信号",
        )

    try:
        result = await analyze_signals(db, body.user_id, signals, scope=body.scope)
        new_suggestions = []
        if result:
            new_suggestions.append(SuggestionBrief(
                id=result["id"],
                title=result["title"],
                severity=result["severity"],
                trigger_type="ai",
            ))
        return TriggerAnalysisResponse(
            triggered=True,
            new_suggestions=new_suggestions,
            message=f"已分析最近数据，生成 {len(new_suggestions)} 条建议",
        )
    except Exception as e:
        return TriggerAnalysisResponse(
            triggered=False,
            new_suggestions=[],
            message=f"AI 分析失败: {str(e)}",
        )


@router.get("", response_model=list[SuggestionBrief])
async def list_suggestions(
    user_id: str = Query(...),
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Suggestion).where(Suggestion.user_id == user_id)
    if status:
        stmt = stmt.where(Suggestion.status == status)
    stmt = stmt.order_by(Suggestion.created_at.desc())
    result = await db.execute(stmt)
    suggestions = result.scalars().all()
    return [
        SuggestionBrief(
            id=s.id, title=s.title, severity=s.severity,
            trigger_type=s.trigger_type, status=s.status or "pending",
            created_at=s.created_at,
        )
        for s in suggestions
    ]


@router.get("/{suggestion_id}", response_model=SuggestionDetail)
async def get_suggestion(suggestion_id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Suggestion)
        .where(Suggestion.id == suggestion_id)
        .options(
            selectinload(Suggestion.signals),
            selectinload(Suggestion.references),
        )
    )
    result = await db.execute(stmt)
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    return SuggestionDetail(
        id=s.id,
        title=s.title,
        severity=s.severity,
        trigger_type=s.trigger_type,
        status=s.status or "pending",
        created_at=s.created_at,
        signals=[
            SignalDetail(
                id=sig.id, description=sig.description,
                value=sig.value, trend=sig.trend,
            )
            for sig in s.signals
        ],
        analysis=s.analysis,
        recommendations=_parse_json_list(s.recommendations),
        alternatives=_parse_json_list(s.alternatives),
        references=[
            ReferenceDetail(
                source=ref.source, section=ref.section,
                summary=ref.summary,
            )
            for ref in s.references
        ],
        confidence=s.confidence,
        user_feedback=s.user_feedback,
    )


@router.put("/{suggestion_id}/status", response_model=SuggestionDetail)
async def update_suggestion_status(
    suggestion_id: str,
    body: SuggestionStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Suggestion)
        .where(Suggestion.id == suggestion_id)
        .options(
            selectinload(Suggestion.signals),
            selectinload(Suggestion.references),
        )
    )
    result = await db.execute(stmt)
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    s.status = body.status
    now = _now()
    if body.status == "adopted":
        s.adopted_at = now
    elif body.status == "ignored":
        s.ignored_at = now
    if body.feedback:
        s.user_feedback = body.feedback
    s.updated_at = now

    await db.commit()
    await db.refresh(s)

    return SuggestionDetail(
        id=s.id,
        title=s.title,
        severity=s.severity,
        trigger_type=s.trigger_type,
        status=s.status,
        created_at=s.created_at,
        signals=[
            SignalDetail(
                id=sig.id, description=sig.description,
                value=sig.value, trend=sig.trend,
            )
            for sig in s.signals
        ],
        analysis=s.analysis,
        recommendations=_parse_json_list(s.recommendations),
        alternatives=_parse_json_list(s.alternatives),
        references=[
            ReferenceDetail(
                source=ref.source, section=ref.section,
                summary=ref.summary,
            )
            for ref in s.references
        ],
        confidence=s.confidence,
        user_feedback=s.user_feedback,
    )
