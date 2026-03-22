import uuid

from sqlalchemy import String, Integer, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class TrainingPlan(Base, TimestampMixin):
    __tablename__ = "training_plans"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    plan_name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    days_per_week: Mapped[int] = mapped_column(Integer, nullable=False)
    days: Mapped[dict] = mapped_column(JSON, nullable=False)
    methodology_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    warnings: Mapped[list] = mapped_column(JSON, default=list, server_default="[]")
    constraints: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="chat"
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="draft"
    )
    parent_plan_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("training_plans.id", ondelete="SET NULL"),
        nullable=True,
    )
