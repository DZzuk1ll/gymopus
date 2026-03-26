from __future__ import annotations

import secrets

from sqlalchemy import Column, Float, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from models import Base


def _gen_id() -> str:
    return secrets.token_hex(16)


class Suggestion(Base):
    __tablename__ = "suggestions"

    id = Column(String(32), primary_key=True, default=_gen_id)
    user_id = Column(String(32), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(Text, nullable=False)
    severity = Column(String(10), nullable=False)  # info / warning / danger
    trigger_type = Column(String(10), nullable=False)  # rule / ai
    status = Column(String(10), default="pending")  # pending / adopted / ignored / deferred
    analysis = Column(Text, nullable=False)
    recommendations = Column(Text, nullable=False)  # JSON list
    alternatives = Column(Text, default="[]")  # JSON list
    rule_id = Column(Text)
    ai_model = Column(Text)
    ai_prompt = Column(Text)
    confidence = Column(Float)
    adopted_at = Column(Text)
    ignored_at = Column(Text)
    user_feedback = Column(Text)
    created_at = Column(Text)
    updated_at = Column(Text)

    user = relationship("User", back_populates="suggestions")
    signals = relationship("SuggestionSignal", back_populates="suggestion", cascade="all, delete-orphan")
    references = relationship("SuggestionReference", back_populates="suggestion", cascade="all, delete-orphan")


class SuggestionSignal(Base):
    __tablename__ = "suggestion_signals"

    id = Column(String(32), primary_key=True, default=_gen_id)
    suggestion_id = Column(String(32), ForeignKey("suggestions.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=False)
    value = Column(Text, nullable=False)
    trend = Column(String(10))  # up / down / neutral
    data_source = Column(Text)
    raw_data = Column(Text)  # JSON

    suggestion = relationship("Suggestion", back_populates="signals")


class SuggestionReference(Base):
    __tablename__ = "suggestion_references"

    id = Column(String(32), primary_key=True, default=_gen_id)
    suggestion_id = Column(String(32), ForeignKey("suggestions.id", ondelete="CASCADE"), nullable=False)
    knowledge_id = Column(String(32), ForeignKey("knowledge_entries.id"))
    source = Column(Text, nullable=False)
    section = Column(Text)
    summary = Column(Text, nullable=False)

    suggestion = relationship("Suggestion", back_populates="references")
