from __future__ import annotations


def calculate_bmr(
    weight_kg: float,
    height_cm: float,
    age: int,
    gender: str,
) -> float:
    """Mifflin-St Jeor formula for basal metabolic rate."""
    if gender == "male":
        return 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        return 10 * weight_kg + 6.25 * height_cm - 5 * age - 161


def calculate_tdee(
    bmr: float,
    days_per_week: int,
    minutes_per_session: int = 60,
) -> float:
    """Estimate TDEE based on training frequency."""
    if days_per_week <= 2:
        factor = 1.375
    elif days_per_week <= 4:
        factor = 1.55
    elif days_per_week <= 6:
        factor = 1.725
    else:
        factor = 1.9
    return bmr * factor


def calculate_nutrition_targets(
    tdee: float,
    weight_kg: float,
    diet_goal: str,
    training_goal: str,
) -> dict[str, int]:
    """Calculate macronutrient targets based on goals."""
    calorie_adjustments = {
        "surplus": 300,
        "deficit": -500,
        "maintain": 0,
    }
    target_calories = int(tdee + calorie_adjustments.get(diet_goal, 0))

    protein_per_kg = {
        "muscle": 2.0,
        "fat-loss": 2.2,
        "strength": 1.8,
        "maintain": 1.6,
    }
    protein_g = int(weight_kg * protein_per_kg.get(training_goal, 1.8))

    fat_g = int(weight_kg * 0.9)

    protein_cal = protein_g * 4
    fat_cal = fat_g * 9
    carbs_g = int((target_calories - protein_cal - fat_cal) / 4)

    return {
        "calories": target_calories,
        "protein_g": protein_g,
        "carbs_g": max(carbs_g, 100),
        "fat_g": fat_g,
    }


def calculate_training_volume(sets: list[dict]) -> float:
    """Calculate training volume (total load = sum of reps * weight)."""
    total = 0.0
    for s in sets:
        reps = s.get("actual_reps") or s.get("target_reps") or 0
        weight = s.get("actual_weight") or s.get("target_weight") or 0
        total += reps * weight
    return total
