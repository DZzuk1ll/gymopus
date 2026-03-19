import uuid

import pytest
from httpx import AsyncClient


# --- Health ---


@pytest.mark.anyio
async def test_health_check(client: AsyncClient):
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "ok"


# --- Users ---


@pytest.mark.anyio
async def test_get_user_creates_new(auth_client: AsyncClient):
    response = await auth_client.get("/api/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["onboarding_completed"] is False


@pytest.mark.anyio
async def test_update_profile(auth_client: AsyncClient):
    response = await auth_client.put(
        "/api/users/me/profile",
        json={"gender": "male", "age": 25, "training_goal": "muscle_gain"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["gender"] == "male"
    assert data["data"]["age"] == 25


@pytest.mark.anyio
async def test_update_profile_with_equipment(auth_client: AsyncClient):
    response = await auth_client.put(
        "/api/users/me/profile",
        json={
            "available_equipment": ["杠铃", "哑铃"],
            "training_frequency_per_week": 4,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["available_equipment"] == ["杠铃", "哑铃"]
    assert data["data"]["training_frequency_per_week"] == 4


# --- Knowledge ---


@pytest.mark.anyio
async def test_list_exercises(auth_client: AsyncClient):
    response = await auth_client.get("/api/knowledge/exercises")
    assert response.status_code == 200
    assert response.json()["success"] is True


@pytest.mark.anyio
async def test_list_exercises_filter(auth_client: AsyncClient):
    response = await auth_client.get("/api/knowledge/exercises?muscle_group=chest")
    assert response.status_code == 200
    assert response.json()["success"] is True


@pytest.mark.anyio
async def test_get_exercise_not_found(auth_client: AsyncClient):
    fake_id = str(uuid.uuid4())
    response = await auth_client.get(f"/api/knowledge/exercises/{fake_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False


@pytest.mark.anyio
async def test_list_foods(auth_client: AsyncClient):
    response = await auth_client.get("/api/knowledge/foods")
    assert response.status_code == 200
    assert response.json()["success"] is True


# --- Workout Logs ---


@pytest.mark.anyio
async def test_create_workout_log(auth_client: AsyncClient):
    # Ensure user exists first
    await auth_client.get("/api/users/me")
    response = await auth_client.post(
        "/api/workouts/logs",
        json={
            "entries": [
                {
                    "logged_date": "2026-03-19",
                    "exercise_name": "Bench Press",
                    "sets_completed": 3,
                    "reps_completed": 10,
                    "weight_kg": 60.0,
                }
            ]
        },
    )
    assert response.status_code == 200
    assert response.json()["success"] is True


@pytest.mark.anyio
async def test_list_workout_logs(auth_client: AsyncClient):
    response = await auth_client.get("/api/workouts/logs")
    assert response.status_code == 200
    assert response.json()["success"] is True


# --- Meal Logs ---


@pytest.mark.anyio
async def test_create_meal_log(auth_client: AsyncClient):
    await auth_client.get("/api/users/me")
    response = await auth_client.post(
        "/api/meals/logs",
        json={
            "logged_date": "2026-03-19",
            "meal_type": "lunch",
            "raw_description": "米饭一碗，鸡胸肉200g",
        },
    )
    assert response.status_code == 200
    assert response.json()["success"] is True


@pytest.mark.anyio
async def test_list_meal_logs(auth_client: AsyncClient):
    response = await auth_client.get("/api/meals/logs")
    assert response.status_code == 200
    assert response.json()["success"] is True


# --- Daily Status ---


@pytest.mark.anyio
async def test_upsert_daily_status(auth_client: AsyncClient):
    await auth_client.get("/api/users/me")
    response = await auth_client.post(
        "/api/status/daily",
        json={
            "date": "2026-03-19",
            "weight_kg": 75.5,
            "sleep_hours": 7.5,
            "fatigue_level": 3,
            "stress_level": 2,
            "mood": 4,
        },
    )
    assert response.status_code == 200
    assert response.json()["success"] is True


@pytest.mark.anyio
async def test_list_daily_statuses(auth_client: AsyncClient):
    response = await auth_client.get("/api/status/daily")
    assert response.status_code == 200
    assert response.json()["success"] is True


@pytest.mark.anyio
async def test_get_status_report(auth_client: AsyncClient):
    response = await auth_client.get("/api/status/report?period=weekly")
    assert response.status_code == 200
    assert response.json()["success"] is True


# --- User Deletion ---


@pytest.mark.anyio
async def test_delete_user(auth_client: AsyncClient):
    # Create user first
    await auth_client.get("/api/users/me")
    response = await auth_client.delete("/api/users/me")
    assert response.status_code == 200
    assert response.json()["success"] is True
