import pytest
from fastapi.testclient import TestClient

from app.job_dispatcher import WorkerQueueUnavailable
from app.main import app


client = TestClient(app)


@pytest.fixture(autouse=True)
def disable_real_queue_dispatch(monkeypatch) -> None:
    monkeypatch.setattr("app.main.enqueue_worker_job", lambda _job_id: None, raising=False)


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


def test_create_worker_job_dispatches_job_id(monkeypatch) -> None:
    dispatched_job_ids: list[str] = []
    monkeypatch.setattr("app.main.enqueue_worker_job", dispatched_job_ids.append)
    run_id = _create_run()

    response = client.post(f"/runs/{run_id}/jobs")

    assert response.status_code == 201
    assert dispatched_job_ids == [response.json()["id"]]


def test_manual_worker_tick_is_not_exposed() -> None:
    run_id = _create_run()
    job_response = client.post(f"/runs/{run_id}/jobs")
    job_id = job_response.json()["id"]

    response = client.post(f"/jobs/{job_id}/tick")

    assert response.status_code == 404


def test_create_worker_job_for_unknown_run_returns_404() -> None:
    response = client.post("/runs/missing-run/jobs")

    assert response.status_code == 404
    assert response.json()["detail"] == "Run not found"


def test_queue_outage_returns_service_unavailable(monkeypatch) -> None:
    def fail_to_enqueue(_job_id: str) -> None:
        raise WorkerQueueUnavailable("Redis is unavailable")

    monkeypatch.setattr("app.main.enqueue_worker_job", fail_to_enqueue)
    run_id = _create_run()

    response = client.post(f"/runs/{run_id}/jobs")

    assert response.status_code == 503
    assert response.json()["detail"] == "Worker queue is unavailable"
