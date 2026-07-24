from importlib import import_module


class FakeQueue:
    def __init__(self) -> None:
        self.calls: list[tuple[str, tuple[object, ...], dict[str, object]]] = []

    def enqueue(self, function_name: str, *args: object, **kwargs: object) -> None:
        self.calls.append((function_name, args, kwargs))


def test_redis_dispatcher_enqueues_only_the_persisted_job_id() -> None:
    dispatcher_module = import_module("app.job_dispatcher")
    queue = FakeQueue()
    dispatcher = dispatcher_module.RedisJobDispatcher(
        redis_url="redis://localhost:6379/0",
        queue_name="agentops",
        queue_factory=lambda: queue,
        retry_factory=lambda: "retry-policy",
    )

    dispatcher.enqueue("job-123")

    assert queue.calls == [
        (
            "app.worker.execute_worker_job",
            ("job-123",),
            {
                "job_id": "agentops-job-123",
                "job_timeout": 900,
                "result_ttl": 3600,
                "failure_ttl": 86400,
                "retry": "retry-policy",
            },
        )
    ]
