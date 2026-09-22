from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.rag import knowledge_index


@pytest.fixture(autouse=True)
def _seed_knowledge() -> None:
    knowledge_index.load(Path(settings.demo_data_dir))


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_health_returns_ok(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "agentops-api"
    assert body["knowledge_documents"] >= 1


def test_platform_summary_matches_portfolio_plan(client: TestClient) -> None:
    response = client.get("/platform")

    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "AgentOps Studio"
    assert body["product"] == "studio"
    assert body["agents"] == 6
    assert body["workflows"] >= 4
    assert "AWS EKS" in body["cloud_paths"]
    assert "GCP GKE" in body["cloud_paths"]
    assert "multi-agent orchestration" in body["capabilities"]
    assert "Agent Fleet" in body["complements"]
    assert "Contabo" in body["complements"]
    # Studio must not claim to *be* the Contabo Fleet product.
    assert body["product"] != "fleet"


def test_knowledge_is_seeded_and_queryable(client: TestClient) -> None:
    assert len(knowledge_index.documents) >= 3
    listed = client.get("/knowledge")
    assert listed.status_code == 200
    assert listed.json()["chunk_count"] >= 1

    queried = client.post("/knowledge/query", json={"query": "refund policy", "top_k": 2})
    assert queried.status_code == 200
    hits = queried.json()["hits"]
    assert len(hits) >= 1
    assert "refund" in hits[0]["text"].lower() or "14" in hits[0]["text"]


def test_mcp_tools_list_and_invoke(client: TestClient) -> None:
    listed = client.get("/mcp/tools")
    assert listed.status_code == 200
    names = {tool["name"] for tool in listed.json()["tools"]}
    assert "knowledge_search" in names
    assert "web_search" in names

    invoked = client.post(
        "/mcp/tools/knowledge_search/invoke",
        json={"arguments": {"query": "executive brief slack", "top_k": 2}},
    )
    assert invoked.status_code == 200
    body = invoked.json()
    assert body["ok"] is True
    assert "hits" in body["result"]


def test_executive_brief_run_produces_traces_and_approval(client: TestClient) -> None:
    created = client.post(
        "/runs",
        json={"workflow_id": "executive-daily-brief"},
    )
    assert created.status_code == 200
    run = created.json()
    assert run["status"] == "approval"
    assert run["artifact"]
    assert len(run["steps"]) >= 4
    assert len(run["citations"]) >= 1

    detail = client.get(f"/runs/{run['id']}")
    assert detail.status_code == 200
    assert len(detail.json()["spans"]) >= 3

    traces = client.get("/traces", params={"run_id": run["id"]})
    assert traces.status_code == 200
    assert traces.json()["count"] >= 3

    approved = client.post(f"/runs/{run['id']}/approve")
    assert approved.status_code == 200
    assert approved.json()["status"] == "done"


def test_unknown_workflow_returns_404(client: TestClient) -> None:
    response = client.post("/runs", json={"workflow_id": "does-not-exist"})
    assert response.status_code == 404
