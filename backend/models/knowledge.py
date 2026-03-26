from __future__ import annotations

import secrets

from sqlalchemy import Column, Index, LargeBinary, String, Text

from models import Base


def _gen_id() -> str:
    return secrets.token_hex(16)


class KnowledgeEntry(Base):
    __tablename__ = "knowledge_entries"
    __table_args__ = (
        Index("idx_knowledge_category", "category"),
        Index("idx_knowledge_subcategory", "subcategory"),
    )

    id = Column(String(32), primary_key=True, default=_gen_id)
    source = Column(Text, nullable=False)
    section = Column(Text)
    category = Column(String(30), nullable=False)  # training / nutrition / recovery / general
    subcategory = Column(String(50))
    title = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    tags = Column(Text)  # JSON list
    content_tokens = Column(Text)  # tokenized for BM25
    embedding = Column(LargeBinary)  # reserved for future vector search
    created_at = Column(Text)
    updated_at = Column(Text)
