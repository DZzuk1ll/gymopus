import uuid
from datetime import date

from sqlalchemy import Integer, Date, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class RateLimitCounter(Base, TimestampMixin):
    __tablename__ = "rate_limit_counters"
    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_rate_limit_user_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    call_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
