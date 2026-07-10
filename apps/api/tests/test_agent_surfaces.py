from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_research_overview_returns_pipeline() -> None:
    response = client.get("/research/overview")

    assert response.status_code == 200
    body = response.json()
    assert body["workflow_id"] == "research-report"
    assert len(body["pipeline"]) >= 1
    assert len(body["workspace_cards"]) >= 1


def test_mcp_tools_returns_catalog() -> None:
    response = client.get("/mcp/tools")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] >= 5
    names = {tool["name"] for tool in body["tools"]}
    assert "SearXNG" in names
    assert "Langfuse" in names


def test_traces_summary_returns_waterfall_and_events() -> None:
    response = client.get("/traces/summary")

    assert response.status_code == 200
    body = response.json()
    assert body["runs_total"] >= 1
    assert body["events_total"] >= 1
    assert len(body["waterfall"]) >= 1
    assert len(body["recent_events"]) >= 1
