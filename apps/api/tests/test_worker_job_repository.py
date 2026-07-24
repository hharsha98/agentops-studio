from importlib import import_module

import pytest

from app.replay_store import create_replay_run
from app.repository import RunRepository
from app.schemas import ReplayRunRequest
from app.worker_queue import create_worker_job, get_worker_job, tick_worker_job


def _create_run(repository: RunRepository) -> str:
    run = create_replay_run(
        ReplayRunRequest(
            workflow_id="executive-daily-brief",
            goal="Persist worker execution state across application restarts",
        ),
        repository=repository,
    )
    assert run is not None
    return run.id


def test_worker_job_persists_across_repository_reload(tmp_path) -> None:
    database_url = f"sqlite:///{tmp_path / 'worker-jobs.db'}"
    repository = RunRepository(database_url)
    run_id = _create_run(repository)

    created = create_worker_job(run_id, repository=repository)

    reloaded_repository = RunRepository(database_url)
    reloaded = get_worker_job(created.id, repository=reloaded_repository)

    assert reloaded == created


def test_worker_job_progress_persists_across_repository_reload(tmp_path) -> None:
    database_url = f"sqlite:///{tmp_path / 'worker-jobs.db'}"
    repository = RunRepository(database_url)
    run_id = _create_run(repository)
    created = create_worker_job(run_id, repository=repository)

    updated = tick_worker_job(created.id, repository=repository)

    reloaded_repository = RunRepository(database_url)
    reloaded = get_worker_job(created.id, repository=reloaded_repository)

    assert updated is not None
    assert reloaded == updated
    assert reloaded.status == "running"
    assert reloaded.steps_completed == 1


def test_only_one_worker_can_claim_a_queued_job(tmp_path) -> None:
    repository = RunRepository(f"sqlite:///{tmp_path / 'worker-jobs.db'}")
    run_id = _create_run(repository)
    created = create_worker_job(run_id, repository=repository)

    first_claim = repository.claim_worker_job(created.id)
    duplicate_claim = repository.claim_worker_job(created.id)

    assert first_claim is not None
    assert first_claim.status == "running"
    assert first_claim.attempts == 1
    assert duplicate_claim is None


def test_async_worker_executes_until_human_approval(tmp_path) -> None:
    repository = RunRepository(f"sqlite:///{tmp_path / 'worker-jobs.db'}")
    run_id = _create_run(repository)
    created = create_worker_job(run_id, repository=repository)
    worker = import_module("app.worker")

    result = worker.execute_worker_job(created.id, repository=repository)

    assert result is not None
    assert result.status == "waiting_for_approval"
    assert result.steps_completed == 3
    assert repository.get_run(run_id).status == "approval"


def test_async_worker_ignores_duplicate_delivery(tmp_path) -> None:
    repository = RunRepository(f"sqlite:///{tmp_path / 'worker-jobs.db'}")
    run_id = _create_run(repository)
    created = create_worker_job(run_id, repository=repository)
    worker = import_module("app.worker")

    first_result = worker.execute_worker_job(created.id, repository=repository)
    trace_after_first_delivery = list(repository.get_run(run_id).trace)
    duplicate_result = worker.execute_worker_job(created.id, repository=repository)

    assert first_result is not None
    assert duplicate_result == first_result
    assert repository.get_run(run_id).trace == trace_after_first_delivery


def test_async_worker_requeues_transient_failure(tmp_path, monkeypatch) -> None:
    repository = RunRepository(f"sqlite:///{tmp_path / 'worker-jobs.db'}")
    run_id = _create_run(repository)
    created = create_worker_job(run_id, repository=repository)
    worker = import_module("app.worker")

    def fail_worker_step(_job_id: str, *, repository: RunRepository):
        raise RuntimeError("temporary model gateway outage")

    monkeypatch.setattr(worker, "tick_worker_job", fail_worker_step)

    with pytest.raises(RuntimeError, match="temporary model gateway outage"):
        worker.execute_worker_job(created.id, repository=repository)

    requeued = repository.get_worker_job(created.id)
    assert requeued.status == "queued"
    assert requeued.attempts == 1
    assert requeued.error == "temporary model gateway outage"


def test_async_worker_stops_after_three_failed_attempts(tmp_path, monkeypatch) -> None:
    repository = RunRepository(f"sqlite:///{tmp_path / 'worker-jobs.db'}")
    run_id = _create_run(repository)
    created = create_worker_job(run_id, repository=repository)
    worker = import_module("app.worker")

    def fail_worker_step(_job_id: str, *, repository: RunRepository):
        raise RuntimeError("persistent tool failure")

    monkeypatch.setattr(worker, "tick_worker_job", fail_worker_step)

    for _attempt in range(2):
        with pytest.raises(RuntimeError, match="persistent tool failure"):
            worker.execute_worker_job(created.id, repository=repository)

    failed = worker.execute_worker_job(created.id, repository=repository)

    assert failed.status == "failed"
    assert failed.attempts == 3
    assert failed.error == "persistent tool failure"
