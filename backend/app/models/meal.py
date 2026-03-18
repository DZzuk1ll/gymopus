import uuid
from datetime import date

from sqlalchemy import Date, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class MealLog(Base, TimestampMixin):
    __tablename__ = "meal_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    logged_date: Mapped[date] = mapped_column(Date)
    meal_type: Mapped[str] = mapped_column(String(20))  # breakfast/lunch/dinner/snack
    raw_description: Mapped[str] = mapped_column(Text)
    parsed_foods: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    total_calories: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_protein: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_fat: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_carbs: Mapped[float | None] = mapped_column(Float, nullable=True)
    analysis_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
