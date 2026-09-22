from __future__ import annotations

import threading
from datetime import datetime, timezone

from .models import RunRecord, TraceSpan


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class RunStore:
    """Thread-safe in-process store for runs and spans (demo-scale)."""

    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._runs: dict[str, RunRecord] = {}
        self._spans: dict[str, list[TraceSpan]] = {}

    def upsert_run(self, run: RunRecord) -> RunRecord:
        with self._lock:
            self._runs[run.id] = run
            return run

    def get_run(self, run_id: str) -> RunRecord | None:
        with self._lock:
            return self._runs.get(run_id)

    def list_runs(self) -> list[RunRecord]:
        with self._lock:
            return sorted(self._runs.values(), key=lambda r: r.created_at, reverse=True)

    def add_span(self, span: TraceSpan) -> TraceSpan:
        with self._lock:
            self._spans.setdefault(span.run_id, []).append(span)
            return span

    def list_spans(self, run_id: str | None = None) -> list[TraceSpan]:
        with self._lock:
            if run_id:
                return list(self._spans.get(run_id, []))
            spans: list[TraceSpan] = []
            for items in self._spans.values():
                spans.extend(items)
            return sorted(spans, key=lambda s: s.started_at, reverse=True)

    def counts(self) -> dict[str, int]:
        with self._lock:
            by_status: dict[str, int] = {}
            for run in self._runs.values():
                by_status[run.status.value] = by_status.get(run.status.value, 0) + 1
            return {
                "runs": len(self._runs),
                "spans": sum(len(v) for v in self._spans.values()),
                **{f"status_{k}": v for k, v in by_status.items()},
            }


store = RunStore()
