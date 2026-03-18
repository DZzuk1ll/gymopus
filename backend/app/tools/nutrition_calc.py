"""Pure Python nutrition calculations.

Formulas verified from peer-reviewed sources:
- Mifflin-St Jeor (1990): doi:10.1093/ajcn/51.2.241
- Activity factors: Harris-Benedict / ACSM guidelines
- Protein: ISSN Position Stand (2017): doi:10.1186/s12970-017-0177-8
- Caloric adjustments: ISSN/ACSM recommendations
"""

from __future__ import annotations


# --- BMR (Mifflin-St Jeor, 1990) ---

def calc_bmr(weight_kg: float, height_cm: float, age: int, gender: str) -> float:
    """Calculate Basal Metabolic Rate using Mifflin-St Jeor equation.

    Male:   10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) + 5
    Female: 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) - 161
    """
    base = 10 * weight_kg + 6.25 * height_cm - 5 * age
    if gender and gender.lower() in ("male", "男", "m"):
        return base + 5
    return base - 161


# --- TDEE ---

ACTIVITY_FACTORS: dict[str, float] = {
    "sedentary": 1.2,       # little/no exercise
    "light": 1.375,         # 1-3 days/week
    "moderate": 1.55,       # 3-5 days/week
    "active": 1.725,        # 6-7 days/week
    "very_active": 1.9,     # hard exercise + physical job
}


def calc_tdee(bmr: float, activity_level: str) -> float:
    """TDEE = BMR * activity factor."""
    factor = ACTIVITY_FACTORS.get(activity_level, 1.55)
    return round(bmr * factor, 1)


def _activity_from_frequency(freq: int | None) -> str:
    """Map training_frequency_per_week to activity level."""
    if freq is None:
        return "moderate"
    if freq <= 1:
        return "sedentary"
    if freq <= 3:
        return "light"
    if freq <= 5:
        return "moderate"
    if freq <= 6:
        return "active"
    return "very_active"


# --- Target Calories ---

def calc_target_calories(tdee: float, goal: str) -> float:
    """Adjust TDEE for training goal.

    - 增肌 (muscle gain): +300 ~ +500 kcal surplus (use +400)
    - 减脂 (fat loss):   -400 ~ -600 kcal deficit  (use -500)
    - 维持 / others:     0
    """
    goal_lower = (goal or "").lower()
    if goal_lower in ("增肌", "muscle_gain", "bulk"):
        return tdee + 400
    if goal_lower in ("减脂", "fat_loss", "cut"):
        return tdee - 500
    return tdee


# --- Macronutrient Split ---

def calc_macro_split(
    target_calories: float,
    weight_kg: float,
    goal: str,
) -> dict[str, float]:
    """Calculate macro targets.

    Protein (ISSN 2017 Position Stand):
      - 增肌: 1.6-2.2 g/kg (use 2.0)
      - 减脂: 2.0-2.4 g/kg (use 2.2, preserve lean mass)
      - 维持: 1.4-2.0 g/kg (use 1.6)

    Fat: 25% of calories (healthy range 20-35%)
    Carbs: remaining calories
    """
    goal_lower = (goal or "").lower()

    if goal_lower in ("增肌", "muscle_gain", "bulk"):
        protein_per_kg = 2.0
    elif goal_lower in ("减脂", "fat_loss", "cut"):
        protein_per_kg = 2.2
    else:
        protein_per_kg = 1.6

    protein_g = round(weight_kg * protein_per_kg, 1)
    protein_kcal = protein_g * 4

    fat_kcal = target_calories * 0.25
    fat_g = round(fat_kcal / 9, 1)

    carbs_kcal = target_calories - protein_kcal - fat_kcal
    carbs_g = round(max(carbs_kcal, 0) / 4, 1)

    return {
        "calories": round(target_calories, 1),
        "protein_g": protein_g,
        "fat_g": fat_g,
        "carbs_g": carbs_g,
    }


# --- Food Nutrition Aggregation ---

def calc_food_nutrition(
    foods: list[dict],
) -> dict[str, float]:
    """Sum up nutrition from a list of food items.

    Each item: {calories, protein, fat, carbs, portion_g, ...}
    """
    totals = {"calories": 0.0, "protein_g": 0.0, "fat_g": 0.0, "carbs_g": 0.0}
    for f in foods:
        totals["calories"] += f.get("calories", 0)
        totals["protein_g"] += f.get("protein", 0)
        totals["fat_g"] += f.get("fat", 0)
        totals["carbs_g"] += f.get("carbs", 0)
    return {k: round(v, 1) for k, v in totals.items()}


# --- Convenience ---

def calc_user_targets(profile: dict) -> dict[str, float]:
    """Given a user profile dict, compute calorie & macro targets."""
    weight = profile.get("weight_kg") or 70
    height = profile.get("height_cm") or 170
    age = profile.get("age") or 25
    gender = profile.get("gender") or "male"
    goal = profile.get("training_goal") or "维持"
    freq = profile.get("training_frequency_per_week")

    bmr = calc_bmr(weight, height, age, gender)
    activity = _activity_from_frequency(freq)
    tdee = calc_tdee(bmr, activity)
    target_cal = calc_target_calories(tdee, goal)
    return calc_macro_split(target_cal, weight, goal)
