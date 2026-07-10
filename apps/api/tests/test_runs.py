from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_list_runs_returns_replay_summaries() -> None:
    response = client.get("/runs")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] >= 3
    assert body["runs"][0]["id"] == "run-executive-brief"
    assert body["runs"][0]["status"] == "approval"
    assert body["runs"][0]["tasks_total"] >= 4
    assert body["runs"][0]["artifacts_total"] >= 1


def test_get_run_returns_tasks_trace_and_artifacts() -> None:
    response = client.get("/runs/run-executive-brief")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == "run-executive-brief"
    assert body["workflow_id"] == "executive-daily-brief"
    assert len(body["tasks"]) >= 4
    assert len(body["trace"]) >= 4
    assert len(body["artifacts"]) >= 1
    assert any(task["status"] == "approval" for task in body["tasks"])


def test_unknown_run_returns_404() -> None:
    response = client.get("/runs/missing-run")

    assert response.status_code == 404
    assert response.json()["detail"] == "Run not found"


def test_replay_run_starts_from_workflow_template() -> None:
    response = client.post(
        "/runs/replay",
        json={
            "workflow_id": "support-triage",
            "goal": "Prioritize urgent customer issues and draft safe replies.",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["workflow_id"] == "support-triage"
    assert body["goal"] == "Prioritize urgent customer issues and draft safe replies."
    assert body["status"] == "running"
    assert body["tasks"][0]["status"] == "running"
    assert body["trace"][0]["type"] == "run_started"


def test_replay_run_is_listed_and_fetchable_after_creation() -> None:
    response = client.post(
        "/runs/replay",
        json={
            "workflow_id": "research-report",
            "goal": "Compare onboarding risks for the sales workflow"
        },
    )

    assert response.status_code == 201
    created = response.json()

    list_response = client.get("/runs")
    assert list_response.status_code == 200
    assert list_response.json()["runs"][0]["id"] == created["id"]
    assert list_response.json()["runs"][0]["goal"] == created["goal"]

    detail_response = client.get(f"/runs/{created['id']}")
    assert detail_response.status_code == 200
    assert detail_response.json()["workflow_id"] == "research-report"


def test_replay_runs_receive_unique_ids() -> None:
    first_response = client.post(
        "/runs/replay",
        json={
            "workflow_id": "executive-daily-brief",
            "goal": "Prepare the morning leadership operating brief"
        },
    )
    second_response = client.post(
        "/runs/replay",
        json={
            "workflow_id": "executive-daily-brief",
            "goal": "Prepare the afternoon leadership operating brief"
        },
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 201
    assert first_response.json()["id"] != second_response.json()["id"]


def test_list_workflows_returns_templates() -> None:
    response = client.get("/workflows")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] >= 3
    workflow_ids = {workflow["id"] for workflow in body["workflows"]}
    assert {"executive-daily-brief", "support-triage", "research-report"}.issubset(workflow_ids)
