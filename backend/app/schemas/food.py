import uuid

from pydantic import BaseModel, ConfigDict


class FoodResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name_zh: str
    name_en: str
    category: str
    calories_kcal: float
    protein_g: float
    fat_g: float
    carbs_g: float
    fiber_g: float | None = None
    sodium_mg: float | None = None
    potassium_mg: float | None = None
    calcium_mg: float | None = None
    iron_mg: float | None = None
    vitamin_a_ug: float | None = None
    vitamin_c_mg: float | None = None
    common_portion_desc: str | None = None
    common_portion_g: float | None = None
