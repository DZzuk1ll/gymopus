from __future__ import annotations

import secrets

from sqlalchemy import Boolean, Column, ForeignKey, Index, String, Text, Float, Integer
from sqlalchemy.orm import relationship

from models import Base


def _gen_id() -> str:
    return secrets.token_hex(16)


class User(Base):
    __tablename__ = "users"

    id = Column(String(32), primary_key=True, default=_gen_id)
    name = Column(Text, nullable=False)
    gender = Column(String(10))  # male / female / other
    age = Column(Integer)
    height_cm = Column(Float)
    weight_kg = Column(Float)
    body_fat_pct = Column(Float)
    experience = Column(String(10))  # '1-2','2-3','3-5','5+'
    level = Column(String(20), default="intermediate")
    training_goal = Column(String(20))  # muscle / fat-loss / strength / maintain
    injuries = Column(Text)
    parq_answers = Column(Text, default="[]")  # JSON list of 7 booleans
    parq_has_risk = Column(Boolean, default=False)
    unit_system = Column(String(10), default="metric")
    reminder_time = Column(String(5), default="18:00")
    alerts_enabled = Column(Boolean, default=True)
    created_at = Column(Text)
    updated_at = Column(Text)

    ai_configs = relationship("UserAIConfig", back_populates="user", cascade="all, delete-orphan")
    plans = relationship("Plan", back_populates="user", cascade="all, delete-orphan")
    checkins = relationship("CheckinRecord", back_populates="user", cascade="all, delete-orphan")
    suggestions = relationship("Suggestion", back_populates="user", cascade="all, delete-orphan")


class UserAIConfig(Base):
    __tablename__ = "user_ai_configs"
    __table_args__ = (Index("uq_user_provider", "user_id", "provider", unique=True),)

    id = Column(String(32), primary_key=True, default=_gen_id)
    user_id = Column(String(32), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider = Column(String(20), nullable=False)  # openai / anthropic / deepseek / custom
    model = Column(String(100), nullable=False)
    api_key_enc = Column(Text)
    base_url = Column(Text)
    max_tokens = Column(Integer)
    is_active = Column(Boolean, default=True)
    created_at = Column(Text)
    updated_at = Column(Text)

    user = relationship("User", back_populates="ai_configs")
