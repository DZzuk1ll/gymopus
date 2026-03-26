from __future__ import annotations

import json
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from models.suggestion import Suggestion, SuggestionReference, SuggestionSignal
from schemas.common import AlertBrief


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def create_from_rule(
    db: AsyncSession,
    user_id: str,
    alert: AlertBrief,
    recommendation: str = "",
    reference: dict | None = None,
) -> Suggestion:
    now = _now()
    suggestion = Suggestion(
        user_id=user_id,
        title=alert.title,
        severity=alert.severity,
        trigger_type="rule",
        status="pending",
        analysis=recommendation or f"规则 {alert.id} 触发: {alert.title}",
        recommendations=json.dumps([recommendation] if recommendation else []),
        alternatives="[]",
        rule_id=alert.id,
        created_at=now,
        updated_at=now,
    )
    db.add(suggestion)
    await db.flush()

    # Add signal
    signal = SuggestionSignal(
        suggestion_id=suggestion.id,
        description=alert.title,
        value=alert.severity,
        trend="neutral",
    )
    db.add(signal)

    # Add reference if provided
    if reference:
        ref = SuggestionReference(
            suggestion_id=suggestion.id,
            source=reference.get("source", ""),
            section=reference.get("section"),
            summary=reference.get("summary", ""),
        )
        db.add(ref)

    await db.flush()
    return suggestion


async def create_from_ai(
    db: AsyncSession,
    user_id: str,
    title: str,
    severity: str,
    analysis: str,
    recommendations: list[str],
    alternatives: list[str],
    confidence: float,
    signals: list[dict],
    references: list[dict],
    ai_model: str = "",
    ai_prompt: str = "",
) -> Suggestion:
    now = _now()
    suggestion = Suggestion(
        user_id=user_id,
        title=title,
        severity=severity,
        trigger_type="ai",
        status="pending",
        analysis=analysis,
        recommendations=json.dumps(recommendations, ensure_ascii=False),
        alternatives=json.dumps(alternatives, ensure_ascii=False),
        confidence=confidence,
        ai_model=ai_model,
        ai_prompt=ai_prompt,
        created_at=now,
        updated_at=now,
    )
    db.add(suggestion)
    await db.flush()

    for sig in signals:
        db.add(SuggestionSignal(
            suggestion_id=suggestion.id,
            description=sig.get("description", ""),
            value=sig.get("value", ""),
            trend=sig.get("trend", "neutral"),
        ))

    for ref in references:
        db.add(SuggestionReference(
            suggestion_id=suggestion.id,
            knowledge_id=ref.get("knowledge_id"),
            source=ref.get("source", ""),
            section=ref.get("section"),
            summary=ref.get("summary", ""),
        ))

    await db.flush()
    return suggestion
