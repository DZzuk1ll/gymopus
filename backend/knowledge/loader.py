"""Load knowledge base YAML files into the database."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import yaml

try:
    import jieba
except ImportError:
    jieba = None

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.knowledge import KnowledgeEntry


def _tokenize(text: str) -> str:
    """Tokenize text using jieba and return space-separated tokens."""
    if jieba is None:
        return text
    return " ".join(jieba.cut(text))


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def load_knowledge_from_yaml(
    db: AsyncSession,
    data_dir: str | Path | None = None,
) -> int:
    """
    Load all YAML files from data_dir into knowledge_entries table.
    Returns the number of entries loaded.
    """
    if data_dir is None:
        data_dir = Path(__file__).parent / "data"
    else:
        data_dir = Path(data_dir)

    if not data_dir.exists():
        return 0

    count = 0
    now = _now()

    for yaml_file in sorted(data_dir.rglob("*.yaml")):
        with open(yaml_file, encoding="utf-8") as f:
            data = yaml.safe_load(f)

        if not data or "entries" not in data:
            continue

        for entry_data in data["entries"]:
            entry_id = entry_data.get("id", "")

            # Check if already exists
            result = await db.execute(
                select(KnowledgeEntry).where(KnowledgeEntry.id == entry_id)
            )
            existing = result.scalar_one_or_none()

            content = entry_data.get("content", "")
            title = entry_data.get("title", "")
            tags = entry_data.get("tags", [])
            tags_text = " ".join(tags) if tags else ""

            tokenized = _tokenize(f"{title} {content} {tags_text}")

            if existing:
                existing.source = entry_data.get("source", existing.source)
                existing.section = entry_data.get("section", existing.section)
                existing.category = entry_data.get("category", existing.category)
                existing.subcategory = entry_data.get("subcategory", existing.subcategory)
                existing.title = title
                existing.content = content
                existing.tags = json.dumps(tags, ensure_ascii=False)
                existing.content_tokens = tokenized
                existing.updated_at = now
            else:
                entry = KnowledgeEntry(
                    id=entry_id,
                    source=entry_data.get("source", ""),
                    section=entry_data.get("section"),
                    category=entry_data.get("category", "general"),
                    subcategory=entry_data.get("subcategory"),
                    title=title,
                    content=content,
                    tags=json.dumps(tags, ensure_ascii=False),
                    content_tokens=tokenized,
                    created_at=now,
                    updated_at=now,
                )
                db.add(entry)
            count += 1

    await db.commit()
    return count
