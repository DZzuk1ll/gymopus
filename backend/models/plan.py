from __future__ import annotations

import secrets

from sqlalchemy import Column, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import relationship

from models import Base


def _gen_id() -> str:
    return secrets.token_hex(16)


class Plan(Base):
    __tablename__ = "plans"

    id = Column(String(32), primary_key=True, default=_gen_id)
    user_id = Column(String(32), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(Text, nullable=False)
    goal = Column(String(20), nullable=False)
    split_type = Column(String(20), nullable=False)
    days_per_week = Column(Integer, nullable=False)
    minutes_per_session = Column(Integer, nullable=False)
    equipment = Column(String(20), nullable=False)
    total_weeks = Column(Integer, nullable=False)
    current_week = Column(Integer, default=1)
    status = Column(String(20), default="active")
    # Nutrition targets
    diet_goal = Column(String(20))
    target_calories = Column(Integer)
    target_protein = Column(Integer)
    target_carbs = Column(Integer)
    target_fat = Column(Integer)
    meals_per_day = Column(Integer, default=4)
    diet_restrictions = Column(Text)  # JSON list
    # AI generation metadata
    generation_prompt = Column(Text)
    generation_model = Column(Text)
    knowledge_refs = Column(Text)  # JSON list of knowledge entry IDs
    created_at = Column(Text)
    updated_at = Column(Text)

    user = relationship("User", back_populates="plans")
    weeks = relationship("PlanWeek", back_populates="plan", cascade="all, delete-orphan", order_by="PlanWeek.week_number")


class PlanWeek(Base):
    __tablename__ = "plan_weeks"
    __table_args__ = (Index("uq_plan_week", "plan_id", "week_number", unique=True),)

    id = Column(String(32), primary_key=True, default=_gen_id)
    plan_id = Column(String(32), ForeignKey("plans.id", ondelete="CASCADE"), nullable=False)
    week_number = Column(Integer, nullable=False)
    theme = Column(Text)
    volume_target = Column(Float)
    intensity_modifier = Column(Float, default=1.0)
    notes = Column(Text)

    plan = relationship("Plan", back_populates="weeks")
    days = relationship("PlanDay", back_populates="week", cascade="all, delete-orphan", order_by="PlanDay.day_of_week")


class PlanDay(Base):
    __tablename__ = "plan_days"
    __table_args__ = (Index("uq_week_day", "week_id", "day_of_week", unique=True),)

    id = Column(String(32), primary_key=True, default=_gen_id)
    week_id = Column(String(32), ForeignKey("plan_weeks.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 1=Mon, 7=Sun
    day_type = Column(String(30), nullable=False)
    label = Column(Text)
    target_muscles = Column(Text)  # JSON list
    estimated_duration = Column(Integer)
    notes = Column(Text)

    week = relationship("PlanWeek", back_populates="days")
    exercises = relationship("PlanExercise", back_populates="day", cascade="all, delete-orphan", order_by="PlanExercise.order_index")


class PlanExercise(Base):
    __tablename__ = "plan_exercises"
    __table_args__ = (Index("uq_day_order", "day_id", "order_index", unique=True),)

    id = Column(String(32), primary_key=True, default=_gen_id)
    day_id = Column(String(32), ForeignKey("plan_days.id", ondelete="CASCADE"), nullable=False)
    order_index = Column(Integer, nullable=False)
    exercise_name = Column(Text, nullable=False)
    exercise_name_en = Column(Text)
    sets = Column(Integer, nullable=False)
    reps_range = Column(Text, nullable=False)
    target_weight = Column(Text)
    target_rpe = Column(Float)
    rest_seconds = Column(Integer)
    notes = Column(Text)
    superset_group = Column(Text)

    day = relationship("PlanDay", back_populates="exercises")
