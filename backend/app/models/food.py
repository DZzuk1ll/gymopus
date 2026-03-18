import uuid

from sqlalchemy import Float, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Food(Base, TimestampMixin):
    __tablename__ = "foods"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name_zh: Mapped[str] = mapped_column(String(100))
    name_en: Mapped[str] = mapped_column(String(200))
    category: Mapped[str] = mapped_column(String(50))  # grain/protein/vegetable/fruit/dairy/oil/dish/snack/beverage
    calories_kcal: Mapped[float] = mapped_column(Float)
    protein_g: Mapped[float] = mapped_column(Float)
    fat_g: Mapped[float] = mapped_column(Float)
    carbs_g: Mapped[float] = mapped_column(Float)
    fiber_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    sodium_mg: Mapped[float | None] = mapped_column(Float, nullable=True)
    potassium_mg: Mapped[float | None] = mapped_column(Float, nullable=True)
    calcium_mg: Mapped[float | None] = mapped_column(Float, nullable=True)
    iron_mg: Mapped[float | None] = mapped_column(Float, nullable=True)
    vitamin_a_ug: Mapped[float | None] = mapped_column(Float, nullable=True)
    vitamin_c_mg: Mapped[float | None] = mapped_column(Float, nullable=True)
    common_portion_desc: Mapped[str | None] = mapped_column(String(100), nullable=True)
    common_portion_g: Mapped[float | None] = mapped_column(Float, nullable=True)
