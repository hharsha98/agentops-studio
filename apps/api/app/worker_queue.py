from datetime import UTC, datetime
from uuid import uuid4

from .replay_store import DEFAULT_REPOSITORY, advance_run, get_run
from .repository import RunRepository
from .schemas import WorkerJob


def _now_iso() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def create_worker_job(
    run_id: str,
    *,
    repository: RunRepository = DEFAULT_REPOSITORY,
) -> WorkerJob | None:
    run = get_run(run_id, repository=repository)
    if run is None:
        return None

    timestamp = _now_iso()
    job = WorkerJob(
        id=f"job-{uuid4().hex[:10]}",
        run_id=run_id,
        status="queued",
        steps_completed=0,
        message="Worker job queued for agent execution.",
        created_at=timestamp,
        updated_at=timestamp,
    )
    return repository.save_worker_job(job)


def get_worker_job(
    job_id: str,
    *,
    repository: RunRepository = DEFAULT_REPOSITORY,
) -> WorkerJob | None:
    return repository.get_worker_job(job_id)


def tick_worker_job(
    job_id: str,
    *,
    repository: RunRepository = DEFAULT_REPOSITORY,
) -> WorkerJob | None:
    job = get_worker_job(job_id, repository=repository)
    if job is None:
        return None

    if job.status in {"waiting_for_approval", "completed", "failed"}:
        return job

    run = advance_run(job.run_id, repository=repository)
    if run is None:
        updated = job.model_copy(
            update={
                "status": "failed",
                "message": "Run not found while processing worker job.",
                "updated_at": _now_iso(),
            }
        )
        return repository.save_worker_job(updated)

    status = "running"
    message = "Worker advanced the run to the next agent step."
    if run.status == "approval":
        status = "waiting_for_approval"
        message = "Worker paused because the run is waiting for human approval."
    elif run.status == "done":
        status = "completed"
        message = "Worker completed the run."
    elif run.status == "failed":
        status = "failed"
        message = "Worker stopped because the run failed."

    updated = job.model_copy(
        update={
            "status": status,
            "steps_completed": job.steps_completed + 1,
            "message": message,
            "updated_at": _now_iso(),
        }
    )
    return repository.save_worker_job(updated)
