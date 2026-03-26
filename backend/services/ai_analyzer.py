"""AI multi-signal cross-analysis service."""
from __future__ import annotations

import json
from pathlib import Path

from jinja2 import Environment, FileSystemLoader
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.user import User, UserAIConfig
from knowledge.retriever import retriever
from services.ai_integration import ai_client
from services import suggestion_service

_env = Environment(
    loader=FileSystemLoader(str(Path(__file__).parent.parent / "prompts")),
    autoescape=False,
)


async def analyze_signals(
    db: AsyncSession,
    user_id: str,
    signals: list[dict],
    scope: str = "full",
) -> dict | None:
    """
    Perform AI cross-signal analysis.

    Args:
        signals: List of detected signal dicts with description, value, trend
        scope: Analysis scope - full, training, nutrition, recovery

    Returns:
        Created suggestion dict or None if no AI config available
    """
    user = await db.get(User, user_id)
    if not user:
        return None

    # Get AI config
    result = await db.execute(
        select(UserAIConfig).where(
            UserAIConfig.user_id == user_id,
            UserAIConfig.is_active == True,  # noqa: E712
        )
    )
    ai_config = result.scalar_one_or_none()
    if not ai_config:
        return None

    # Build search query from signals
    categories_map = {
        "full": ["training", "nutrition", "recovery"],
        "training": ["training"],
        "nutrition": ["nutrition"],
        "recovery": ["recovery"],
    }
    search_categories = categories_map.get(scope, ["training", "nutrition", "recovery"])

    signal_descriptions = " ".join(s.get("description", "") for s in signals)
    query = f"训练恢复建议 {signal_descriptions}"
    knowledge_entries = await retriever.search(query, categories=search_categories, top_k=5)

    # Build recent metrics summary
    recent_metrics = "\n".join(
        f"- {s.get('description', '')}: {s.get('value', '')} (趋势: {s.get('trend', 'neutral')})"
        for s in signals
    )

    # Render prompt
    template = _env.get_template("suggestion_analysis.j2")
    prompt = template.render(
        signals=signals,
        recent_metrics=recent_metrics,
        user_context={
            "training_goal": user.training_goal,
            "experience": user.experience,
            "weight_kg": user.weight_kg,
        },
        knowledge_entries=knowledge_entries,
    )

    system_template = _env.get_template("system.j2")
    system_prompt = system_template.render()

    # LLM call
    response_text = await ai_client.complete(
        provider=ai_config.provider,
        model=ai_config.model,
        api_key_enc=ai_config.api_key_enc,
        base_url=ai_config.base_url,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
        max_tokens=2048,
    )

    # Parse response
    response_text = response_text.strip()
    if response_text.startswith("```"):
        lines = response_text.split("\n")
        response_text = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])

    result_data = json.loads(response_text)

    # Create suggestion
    references = [
        {
            "knowledge_id": e.id,
            "source": e.source,
            "section": e.section,
            "summary": e.title,
        }
        for e in knowledge_entries
    ]

    suggestion = await suggestion_service.create_from_ai(
        db=db,
        user_id=user_id,
        title=result_data.get("title", "AI 综合分析"),
        severity=result_data.get("severity", "info"),
        analysis=result_data.get("analysis", ""),
        recommendations=result_data.get("recommendations", []),
        alternatives=result_data.get("alternatives", []),
        confidence=result_data.get("confidence", 0.5),
        signals=signals,
        references=references,
        ai_model=f"{ai_config.provider}/{ai_config.model}",
        ai_prompt=prompt[:3000],
    )

    await db.commit()

    return {
        "id": suggestion.id,
        "title": suggestion.title,
        "severity": suggestion.severity,
    }
