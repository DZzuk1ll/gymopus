from __future__ import annotations

import secrets

from sqlalchemy import Column, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import relationship

from models import Base


def _gen_id() -> str:
    return secrets.token_hex(16)


class CheckinRecord(Base):
    __tablename__ = "checkin_records"
    __table_args__ = (Index("uq_user_date", "user_id", "date", unique=True),)

    id = Column(String(32), primary_key=True, default=_gen_id)
    user_id = Column(String(32), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(Text, nullable=False)  # YYYY-MM-DD
    completed_modules = Column(Text, default="[]")  # JSON list
    notes = Column(Text)
    created_at = Column(Text)
    updated_at = Column(Text)

    user = relationship("User", back_populates="checkins")
    training_log = relationship("TrainingLog", back_populates="checkin", uselist=False, cascade="all, delete-orphan")
    nutrition_log = relationship("NutritionLog", back_populates="checkin", uselist=False, cascade="all, delete-orphan")
    sleep_log = relationship("SleepLog", back_populates="checkin", uselist=False, cascade="all, delete-orphan")
    supplement_log = relationship("SupplementLog", back_populates="checkin", uselist=False, cascade="all, delete-orphan")
    mood_log = relationship("MoodLog", back_populates="checkin", uselist=False, cascade="all, delete-orphan")
    body_metrics_log = relationship("BodyMetricsLog", back_populates="checkin", uselist=False, cascade="all, delete-orphan")


class TrainingLog(Base):
    __tablename__ = "training_logs"

    id = Column(String(32), primary_key=True, default=_gen_id)
    checkin_id = Column(String(32), ForeignKey("checkin_records.id", ondelete="CASCADE"), nullable=False, unique=True)
    plan_day_id = Column(String(32), ForeignKey("plan_days.id"))
    total_volume_kg = Column(Float)
    total_sets = Column(Integer)
    duration_min = Column(Integer)
    overall_rpe = Column(Float)
    notes = Column(Text)

    checkin = relationship("CheckinRecord", back_populates="training_log")
    exercise_logs = relationship("ExerciseLog", back_populates="training_log", cascade="all, delete-orphan", order_by="ExerciseLog.order_index")


class ExerciseLog(Base):
    __tablename__ = "exercise_logs"

    id = Column(String(32), primary_key=True, default=_gen_id)
    training_log_id = Column(String(32), ForeignKey("training_logs.id", ondelete="CASCADE"), nullable=False)
    plan_exercise_id = Column(String(32), ForeignKey("plan_exercises.id"))
    exercise_name = Column(Text, nullable=False)
    order_index = Column(Integer, nullable=False)

    training_log = relationship("TrainingLog", back_populates="exercise_logs")
    set_logs = relationship("SetLog", back_populates="exercise_log", cascade="all, delete-orphan", order_by="SetLog.set_number")


class SetLog(Base):
    __tablename__ = "set_logs"
    __table_args__ = (Index("uq_exercise_set", "exercise_log_id", "set_number", unique=True),)

    id = Column(String(32), primary_key=True, default=_gen_id)
    exercise_log_id = Column(String(32), ForeignKey("exercise_logs.id", ondelete="CASCADE"), nullable=False)
    set_number = Column(Integer, nullable=False)
    target_reps = Column(Integer)
    target_weight = Column(Float)
    actual_reps = Column(Integer)
    actual_weight = Column(Float)
    rpe = Column(Float)
    notes = Column(Text)

    exercise_log = relationship("ExerciseLog", back_populates="set_logs")


class NutritionLog(Base):
    __tablename__ = "nutrition_logs"

    id = Column(String(32), primary_key=True, default=_gen_id)
    checkin_id = Column(String(32), ForeignKey("checkin_records.id", ondelete="CASCADE"), nullable=False, unique=True)
    total_calories = Column(Integer)
    total_protein = Column(Float)
    total_carbs = Column(Float)
    total_fat = Column(Float)
    water_ml = Column(Integer)
    notes = Column(Text)

    checkin = relationship("CheckinRecord", back_populates="nutrition_log")
    meals = relationship("MealLog", back_populates="nutrition_log", cascade="all, delete-orphan")


class MealLog(Base):
    __tablename__ = "meal_logs"

    id = Column(String(32), primary_key=True, default=_gen_id)
    nutrition_log_id = Column(String(32), ForeignKey("nutrition_logs.id", ondelete="CASCADE"), nullable=False)
    meal_name = Column(Text, nullable=False)
    items = Column(Text)  # JSON
    calories = Column(Integer)
    protein = Column(Float)
    carbs = Column(Float)
    fat = Column(Float)
    time = Column(Text)  # HH:MM

    nutrition_log = relationship("NutritionLog", back_populates="meals")


class SleepLog(Base):
    __tablename__ = "sleep_logs"

    id = Column(String(32), primary_key=True, default=_gen_id)
    checkin_id = Column(String(32), ForeignKey("checkin_records.id", ondelete="CASCADE"), nullable=False, unique=True)
    bed_time = Column(Text)
    wake_time = Column(Text)
    duration_hours = Column(Float)
    quality_score = Column(Integer)  # 1-10
    deep_sleep_pct = Column(Float)
    notes = Column(Text)

    checkin = relationship("CheckinRecord", back_populates="sleep_log")


class SupplementLog(Base):
    __tablename__ = "supplement_logs"

    id = Column(String(32), primary_key=True, default=_gen_id)
    checkin_id = Column(String(32), ForeignKey("checkin_records.id", ondelete="CASCADE"), nullable=False, unique=True)
    items = Column(Text, nullable=False)  # JSON: [{name, dosage, time, taken}]

    checkin = relationship("CheckinRecord", back_populates="supplement_log")


class MoodLog(Base):
    __tablename__ = "mood_logs"

    id = Column(String(32), primary_key=True, default=_gen_id)
    checkin_id = Column(String(32), ForeignKey("checkin_records.id", ondelete="CASCADE"), nullable=False, unique=True)
    level = Column(Integer, nullable=False)  # 1-5
    description = Column(Text)
    energy_level = Column(Integer)  # 1-5
    stress_level = Column(Integer)  # 1-5
    notes = Column(Text)

    checkin = relationship("CheckinRecord", back_populates="mood_log")


class BodyMetricsLog(Base):
    __tablename__ = "body_metrics_logs"

    id = Column(String(32), primary_key=True, default=_gen_id)
    checkin_id = Column(String(32), ForeignKey("checkin_records.id", ondelete="CASCADE"), nullable=False, unique=True)
    weight_kg = Column(Float)
    body_fat_pct = Column(Float)
    chest_cm = Column(Float)
    waist_cm = Column(Float)
    arm_cm = Column(Float)
    notes = Column(Text)

    checkin = relationship("CheckinRecord", back_populates="body_metrics_log")
