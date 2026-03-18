import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_health_check(client: AsyncClient):
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "ok"


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
