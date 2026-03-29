import pytest


@pytest.mark.asyncio
async def test_submit_checkin(client):
    # Create user first
    resp = await client.post("/api/v1/users", json={"name": "Checkin Test"})
    user_id = resp.json()["id"]

    # Submit checkin with multiple modules
    resp = await client.post("/api/v1/checkins", json={
        "user_id": user_id,
        "date": "2026-03-25",
        "training": {
            "duration_min": 60,
            "overall_rpe": 7.5,
            "exercises": [
                {
                    "exercise_name": "杠铃深蹲",
                    "sets": [
                        {"set_number": 1, "actual_reps": 8, "actual_weight": 100, "rpe": 7},
                        {"set_number": 2, "actual_reps": 8, "actual_weight": 100, "rpe": 8},
                        {"set_number": 3, "actual_reps": 6, "actual_weight": 100, "rpe": 9},
                    ]
                }
            ]
        },
        "sleep": {
            "bed_time": "23:00",
            "wake_time": "07:00",
            "duration_hours": 8,
            "quality_score": 7,
        },
        "mood": {
            "level": 4,
            "energy_level": 4,
            "stress_level": 2,
        },
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "training" in data["completed_modules"]
    assert "sleep" in data["completed_modules"]
    assert "mood" in data["completed_modules"]


@pytest.mark.asyncio
async def test_checkin_upsert(client):
    resp = await client.post("/api/v1/users", json={"name": "Upsert Test"})
    user_id = resp.json()["id"]

    # First submit
    resp = await client.post("/api/v1/checkins", json={
        "user_id": user_id,
        "date": "2026-03-25",
        "mood": {"level": 3},
    })
    assert resp.status_code == 200
    assert resp.json()["completed_modules"] == ["mood"]

    # Second submit same date - should update
    resp = await client.post("/api/v1/checkins", json={
        "user_id": user_id,
        "date": "2026-03-25",
        "sleep": {"duration_hours": 7, "quality_score": 6},
    })
    assert resp.status_code == 200
    modules = resp.json()["completed_modules"]
    assert "mood" in modules
    assert "sleep" in modules


@pytest.mark.asyncio
async def test_get_checkin_by_date(client):
    resp = await client.post("/api/v1/users", json={"name": "GetDate Test"})
    user_id = resp.json()["id"]

    await client.post("/api/v1/checkins", json={
        "user_id": user_id,
        "date": "2026-03-25",
        "mood": {"level": 5},
        "notes": "Great day!",
    })

    resp = await client.get(f"/api/v1/checkins/{user_id}/2026-03-25")
    assert resp.status_code == 200
    data = resp.json()
    assert data["mood"]["level"] == 5
    assert data["notes"] == "Great day!"


@pytest.mark.asyncio
async def test_training_volume_calculation(client):
    resp = await client.post("/api/v1/users", json={"name": "Volume Test"})
    user_id = resp.json()["id"]

    await client.post("/api/v1/checkins", json={
        "user_id": user_id,
        "date": "2026-03-25",
        "training": {
            "exercises": [
                {
                    "exercise_name": "Bench Press",
                    "sets": [
                        {"set_number": 1, "actual_reps": 10, "actual_weight": 60},
                        {"set_number": 2, "actual_reps": 10, "actual_weight": 60},
                    ]
                }
            ]
        }
    })

    resp = await client.get(f"/api/v1/checkins/{user_id}/2026-03-25")
    data = resp.json()
    # Volume = 10*60 + 10*60 = 1200
    assert data["training"]["total_volume_kg"] == 1200
    assert data["training"]["total_sets"] == 2


@pytest.mark.asyncio
async def test_nutrition_estimation_on_checkin_save(client, monkeypatch):
    async def fake_estimate_meal_nutrition(db, user_id, meals):
        return {
            1: {"calories": 510, "protein": 32.0, "carbs": 48.0, "fat": 17.0},
            2: {"calories": 680, "protein": 40.0, "carbs": 72.0, "fat": 22.0},
        }

    monkeypatch.setattr(
        "services.checkin_service.estimate_meal_nutrition",
        fake_estimate_meal_nutrition,
    )

    resp = await client.post("/api/v1/users", json={"name": "Nutrition Test"})
    user_id = resp.json()["id"]

    resp = await client.post("/api/v1/checkins", json={
        "user_id": user_id,
        "date": "2026-03-26",
        "nutrition": {
            "meals": [
                {"meal_name": "早餐", "items": [{"name": "两个鸡蛋、一碗燕麦粥、一杯牛奶"}]},
                {"meal_name": "午餐", "items": [{"name": "鸡胸肉盖饭，加一根香蕉"}]},
            ]
        }
    })
    assert resp.status_code == 200

    resp = await client.get(f"/api/v1/checkins/{user_id}/2026-03-26")
    assert resp.status_code == 200
    data = resp.json()
    assert data["nutrition"]["total_calories"] == 1190
    assert data["nutrition"]["total_protein"] == 72.0
    assert data["nutrition"]["meals"][0]["calories"] == 510
    assert data["nutrition"]["meals"][1]["carbs"] == 72.0
