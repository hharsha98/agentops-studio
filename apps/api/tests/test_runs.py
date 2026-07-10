from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_list_runs_returns_replay_summaries() -> None:
    response = client.get("/runs")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] >= 3
    executive_run = next(run for run in body["runs"] if run["id"] == "run-executive-brief")
    assert executive_run["status"] == "approval"
    assert executive_run["tasks_total"] >= 4
    assert executive_run["artifacts_total"] >= 1


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


def test_advance_run_moves_tasks_and_appends_trace_events() -> None:
    create_response = client.post(
        "/runs/replay",
        json={
            "workflow_id": "executive-daily-brief",
            "goal": "Prepare the operating brief and pause for approval"
        },
    )
    run_id = create_response.json()["id"]

    first_advance = client.post(f"/runs/{run_id}/advance")

    assert first_advance.status_code == 200
    first_body = first_advance.json()
    assert first_body["tasks"][0]["status"] == "done"
    assert first_body["tasks"][1]["status"] == "running"
    assert len(first_body["trace"]) == 3
    assert first_body["trace"][-2]["type"] == "task_completed"
    assert first_body["trace"][-1]["type"] == "task_started"


def test_advance_run_pauses_at_approval_with_artifact() -> None:
    create_response = client.post(
        "/runs/replay",
        json={
            "workflow_id": "executive-daily-brief",
            "goal": "Prepare the operating brief and pause for approval"
        },
    )
    run_id = create_response.json()["id"]

    client.post(f"/runs/{run_id}/advance")
    client.post(f"/runs/{run_id}/advance")
    approval_response = client.post(f"/runs/{run_id}/advance")

    assert approval_response.status_code == 200
    body = approval_response.json()
    assert body["status"] == "approval"
    assert body["tasks"][-1]["status"] == "approval"
    assert body["artifacts"][0]["requires_approval"] is True
    assert body["trace"][-1]["type"] == "approval_required"


def test_advance_unknown_run_returns_404() -> None:
    response = client.post("/runs/missing-run/advance")

    assert response.status_code == 404
    assert response.json()["detail"] == "Run not found"


def test_approve_run_completes_approval_state_run() -> None:
    create_response = client.post(
        "/runs/replay",
        json={
            "workflow_id": "executive-daily-brief",
            "goal": "Prepare the operating brief for final approval"
        },
    )
    run_id = create_response.json()["id"]

    client.post(f"/runs/{run_id}/advance")
    client.post(f"/runs/{run_id}/advance")
    client.post(f"/runs/{run_id}/advance")
    approval_response = client.post(f"/runs/{run_id}/approve")

    assert approval_response.status_code == 200
    body = approval_response.json()
    assert body["status"] == "done"
    assert body["completed_at"] is not None
    assert body["tasks"][-1]["status"] == "done"
    assert body["artifacts"][0]["requires_approval"] is False
    assert body["trace"][-1]["type"] == "approval_completed"


def test_approve_running_run_returns_409() -> None:
    create_response = client.post(
        "/runs/replay",
        json={
            "workflow_id": "support-triage",
            "goal": "Keep the run in progress before approval"
        },
    )
    run_id = create_response.json()["id"]

    response = client.post(f"/runs/{run_id}/approve")

    assert response.status_code == 409
    assert response.json()["detail"] == "Run is not waiting for approval"


def test_approve_unknown_run_returns_404() -> None:
    response = client.post("/runs/missing-run/approve")

    assert response.status_code == 404
    assert response.json()["detail"] == "Run not found"


def test_list_workflows_returns_templates() -> None:
    response = client.get("/workflows")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] >= 3
    workflow_ids = {workflow["id"] for workflow in body["workflows"]}
    assert {"executive-daily-brief", "support-triage", "research-report"}.issubset(workflow_ids)
