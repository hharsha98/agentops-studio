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
