import pytest
import pytest_asyncio


@pytest.mark.asyncio
async def test_create_user(client):
    resp = await client.post("/api/v1/users", json={
        "name": "Test User",
        "gender": "male",
        "age": 25,
        "height_cm": 175,
        "weight_kg": 70,
        "experience": "2-3",
        "training_goal": "muscle",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Test User"
    assert data["gender"] == "male"
    assert data["level"] == "intermediate"
    assert data["parq_has_risk"] is False
    assert len(data["id"]) == 32


@pytest.mark.asyncio
async def test_get_user(client):
    # Create first
    resp = await client.post("/api/v1/users", json={"name": "Get Test"})
    user_id = resp.json()["id"]

    # Get
    resp = await client.get(f"/api/v1/users/{user_id}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "Get Test"


@pytest.mark.asyncio
async def test_get_user_not_found(client):
    resp = await client.get("/api/v1/users/nonexistent")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_user(client):
    resp = await client.post("/api/v1/users", json={"name": "Before"})
    user_id = resp.json()["id"]

    resp = await client.put(f"/api/v1/users/{user_id}", json={
        "name": "After",
        "age": 30,
    })
    assert resp.status_code == 200
    assert resp.json()["name"] == "After"
    assert resp.json()["age"] == 30


@pytest.mark.asyncio
async def test_delete_user(client):
    resp = await client.post("/api/v1/users", json={"name": "ToDelete"})
    user_id = resp.json()["id"]

    resp = await client.delete(f"/api/v1/users/{user_id}")
    assert resp.status_code == 200

    resp = await client.get(f"/api/v1/users/{user_id}")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_parq_risk(client):
    resp = await client.post("/api/v1/users", json={
        "name": "Risky",
        "parq_answers": [False, True, False, False, False, False, False],
    })
    assert resp.status_code == 201
    assert resp.json()["parq_has_risk"] is True
