from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def _create_run() -> str:
    response = client.post(
        "/runs/replay",
        json={
            "workflow_id": "executive-daily-brief",
            "goal": "Process this run through the worker queue",
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_create_worker_job_for_run() -> None:
    run_id = _create_run()

    response = client.post(f"/runs/{run_id}/jobs")

    assert response.status_code == 201
    body = response.json()
    assert body["run_id"] == run_id
    assert body["status"] == "queued"
    assert body["steps_completed"] == 0


def test_worker_tick_advances_run_and_updates_job() -> None:
    run_id = _create_run()
    job_response = client.post(f"/runs/{run_id}/jobs")
    job_id = job_response.json()["id"]

    tick_response = client.post(f"/jobs/{job_id}/tick")

    assert tick_response.status_code == 200
    job = tick_response.json()
    assert job["id"] == job_id
    assert job["status"] == "running"
    assert job["steps_completed"] == 1

    run_response = client.get(f"/runs/{run_id}")
    assert run_response.json()["tasks"][0]["status"] == "done"
    assert run_response.json()["tasks"][1]["status"] == "running"


def test_worker_job_waits_when_run_reaches_approval() -> None:
    run_id = _create_run()
    job_id = client.post(f"/runs/{run_id}/jobs").json()["id"]

    client.post(f"/jobs/{job_id}/tick")
    client.post(f"/jobs/{job_id}/tick")
    response = client.post(f"/jobs/{job_id}/tick")

    assert response.status_code == 200
    job = response.json()
    assert job["status"] == "waiting_for_approval"
    assert job["steps_completed"] == 3
    assert "approval" in job["message"].lower()


def test_create_worker_job_for_unknown_run_returns_404() -> None:
    response = client.post("/runs/missing-run/jobs")

    assert response.status_code == 404
    assert response.json()["detail"] == "Run not found"


def test_tick_unknown_worker_job_returns_404() -> None:
    response = client.post("/jobs/missing-job/tick")

    assert response.status_code == 404
    assert response.json()["detail"] == "Worker job not found"
