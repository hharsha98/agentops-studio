from collections.abc import Callable
from typing import Any, Protocol

from .config import settings


class WorkerQueueUnavailable(RuntimeError):
    pass


class QueueLike(Protocol):
    def enqueue(self, function_name: str, *args: object, **kwargs: object) -> object: ...


class RedisJobDispatcher:
    def __init__(
        self,
        *,
        redis_url: str,
        queue_name: str,
        queue_factory: Callable[[], QueueLike] | None = None,
        retry_factory: Callable[[], Any] | None = None,
    ) -> None:
        self.redis_url = redis_url
        self.queue_name = queue_name
        self.queue_factory = queue_factory or self._build_queue
        self.retry_factory = retry_factory or self._build_retry

    def _build_queue(self) -> QueueLike:
        from redis import Redis
        from rq import Queue

        return Queue(self.queue_name, connection=Redis.from_url(self.redis_url))

    @staticmethod
    def _build_retry() -> Any:
        from rq import Retry

        return Retry(max=2, interval=[5, 30])

    def enqueue(self, job_id: str) -> None:
        self.queue_factory().enqueue(
            "app.worker.execute_worker_job",
            job_id,
            job_id=f"agentops-{job_id}",
            job_timeout=900,
            result_ttl=3600,
            failure_ttl=86400,
            retry=self.retry_factory(),
        )


DEFAULT_JOB_DISPATCHER = RedisJobDispatcher(
    redis_url=settings.redis_url,
    queue_name=settings.worker_queue_name,
)


def enqueue_worker_job(job_id: str) -> None:
    try:
        DEFAULT_JOB_DISPATCHER.enqueue(job_id)
    except WorkerQueueUnavailable:
        raise
    except Exception as exc:
        raise WorkerQueueUnavailable("Worker queue is unavailable") from exc
