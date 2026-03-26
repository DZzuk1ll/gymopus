from utils.calculations import (
    calculate_bmr,
    calculate_nutrition_targets,
    calculate_tdee,
    calculate_training_volume,
)


def test_bmr_male():
    bmr = calculate_bmr(weight_kg=70, height_cm=175, age=25, gender="male")
    # 10*70 + 6.25*175 - 5*25 + 5 = 700 + 1093.75 - 125 + 5 = 1673.75
    assert abs(bmr - 1673.75) < 0.01


def test_bmr_female():
    bmr = calculate_bmr(weight_kg=60, height_cm=165, age=30, gender="female")
    # 10*60 + 6.25*165 - 5*30 - 161 = 600 + 1031.25 - 150 - 161 = 1320.25
    assert abs(bmr - 1320.25) < 0.01


def test_tdee():
    bmr = 1673.75
    tdee = calculate_tdee(bmr, days_per_week=4)
    # factor = 1.55 for 3-4 days
    assert abs(tdee - 1673.75 * 1.55) < 0.01


def test_nutrition_targets_muscle():
    targets = calculate_nutrition_targets(
        tdee=2600, weight_kg=70, diet_goal="surplus", training_goal="muscle"
    )
    assert targets["calories"] == 2900  # 2600 + 300
    assert targets["protein_g"] == 140  # 70 * 2.0
    assert targets["fat_g"] == 63  # 70 * 0.9


def test_nutrition_targets_fat_loss():
    targets = calculate_nutrition_targets(
        tdee=2600, weight_kg=70, diet_goal="deficit", training_goal="fat-loss"
    )
    assert targets["calories"] == 2100  # 2600 - 500
    assert targets["protein_g"] == 154  # 70 * 2.2


def test_training_volume():
    sets = [
        {"actual_reps": 10, "actual_weight": 100},
        {"actual_reps": 8, "actual_weight": 100},
        {"actual_reps": 6, "actual_weight": 100},
    ]
    volume = calculate_training_volume(sets)
    assert volume == 2400  # (10+8+6) * 100


def test_training_volume_fallback_to_target():
    sets = [
        {"target_reps": 10, "target_weight": 80},
    ]
    volume = calculate_training_volume(sets)
    assert volume == 800
