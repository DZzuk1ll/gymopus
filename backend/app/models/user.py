import uuid

from sqlalchemy import String, Integer, Float, Boolean, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    gender: Mapped[str | None] = mapped_column(String(10), nullable=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height_cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    body_fat_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    training_goal: Mapped[str | None] = mapped_column(String(50), nullable=True)
    training_experience_years: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    training_frequency_per_week: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )
    session_duration_minutes: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )
    available_equipment: Mapped[list[str]] = mapped_column(
        ARRAY(String), default=list, server_default="{}"
    )
    dietary_restrictions: Mapped[list[str]] = mapped_column(
        ARRAY(String), default=list, server_default="{}"
    )
    dietary_preferences: Mapped[list[str]] = mapped_column(
        ARRAY(String), default=list, server_default="{}"
    )
    injuries: Mapped[list[str]] = mapped_column(
        ARRAY(String), default=list, server_default="{}"
    )
    onboarding_completed: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false"
    )
