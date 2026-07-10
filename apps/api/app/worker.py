from datetime import UTC, datetime

from .replay_store import DEFAULT_REPOSITORY
from .repository import RunRepository
from .schemas import WorkerJob
from .worker_queue import tick_worker_job


def execute_worker_job(
    job_id: str,
    *,
    repository: RunRepository = DEFAULT_REPOSITORY,
    max_attempts: int = 3,
) -> WorkerJob | None:
    existing = repository.get_worker_job(job_id)
    if existing is None:
        return None

    job = repository.claim_worker_job(job_id)
    if job is None:
        return repository.get_worker_job(job_id)

    try:
        while job.status == "running":
            updated = tick_worker_job(job.id, repository=repository)
            if updated is None:
                return None
            job = updated
    except Exception as exc:
        timestamp = datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")
        attempts_exhausted = job.attempts >= max_attempts
        failed_job = job.model_copy(
            update={
                "status": "failed" if attempts_exhausted else "queued",
                "message": (
                    "Worker stopped after the retry limit was reached."
                    if attempts_exhausted
                    else "Worker step failed and was queued for retry."
                ),
                "updated_at": timestamp,
                "finished_at": timestamp if attempts_exhausted else None,
                "error": str(exc)[:500],
            }
        )
        repository.save_worker_job(failed_job)
        if attempts_exhausted:
            return failed_job
        raise

    return job
