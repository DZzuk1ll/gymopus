import uuid

from sqlalchemy import String, Boolean, Text, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Exercise(Base, TimestampMixin):
    __tablename__ = "exercises"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name_zh: Mapped[str] = mapped_column(String(100), nullable=False)
    name_en: Mapped[str] = mapped_column(String(100), nullable=False)
    primary_muscle_group: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # chest/back/legs/shoulders/arms/core
    secondary_muscle_groups: Mapped[list[str]] = mapped_column(
        ARRAY(String), default=list, server_default="{}"
    )
    equipment: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # barbell/dumbbell/cable/machine/bodyweight/band
    movement_pattern: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # push/pull/hinge/squat/carry/rotation
    difficulty: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # beginner/intermediate/advanced
    description_zh: Mapped[str] = mapped_column(Text, nullable=False)
    instructions_zh: Mapped[str] = mapped_column(Text, nullable=False)
    is_compound: Mapped[bool] = mapped_column(Boolean, default=False)
