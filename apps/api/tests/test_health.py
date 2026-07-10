from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_returns_ok() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "agentops-api"}


def test_platform_summary_matches_portfolio_plan() -> None:
    response = client.get("/platform")

    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "AgentOps Studio"
    assert body["agents"] == 30
    assert body["workflows"] == 10
    assert "AWS EKS" in body["cloud_paths"]
    assert "GCP GKE" in body["cloud_paths"]

