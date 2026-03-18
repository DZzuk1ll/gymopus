import uuid
from datetime import date

from sqlalchemy import Date, Float, Integer, ForeignKey, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class DailyStatus(Base, TimestampMixin):
    __tablename__ = "daily_status"
    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_daily_status_user_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    date: Mapped[date] = mapped_column(Date)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    sleep_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    sleep_quality: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 1-5
    fatigue_level: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 1-5
    stress_level: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 1-5
    mood: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 1-5
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
