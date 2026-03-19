import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient
from langchain_core.messages import AIMessage


@pytest.mark.anyio
async def test_chat_endpoint(auth_client: AsyncClient):
    """Test POST /api/chat with mocked graph."""
    # Ensure user exists with a profile
    await auth_client.get("/api/users/me")
    await auth_client.put(
        "/api/users/me/profile",
        json={"gender": "male", "age": 25, "training_goal": "muscle_gain"},
    )

    mock_result = {
        "response": "渐进式超负荷是指逐步增加训练负荷。",
        "intent": "qa",
        "messages": [AIMessage(content="渐进式超负荷是指逐步增加训练负荷。")],
        "workout_plan": None,
        "meal_plan": None,
        "diet_analysis": None,
    }

    mock_graph = AsyncMock()
    mock_graph.ainvoke.return_value = mock_result

    with patch.object(
        auth_client._transport._app.state,  # type: ignore[union-attr]
        "graph",
        mock_graph,
    ):
        response = await auth_client.post(
            "/api/chat",
            json={"message": "什么是渐进式超负荷？"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["intent"] == "qa"
    assert "渐进式超负荷" in data["data"]["response"]


@pytest.mark.anyio
async def test_chat_history_empty(auth_client: AsyncClient):
    """Test GET /api/chat/history returns empty for new user."""
    await auth_client.get("/api/users/me")

    mock_state = MagicMock()
    mock_state.values = {}

    mock_graph = AsyncMock()
    mock_graph.aget_state.return_value = mock_state

    with patch.object(
        auth_client._transport._app.state,  # type: ignore[union-attr]
        "graph",
        mock_graph,
    ):
        response = await auth_client.get("/api/chat/history")

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"] == []
