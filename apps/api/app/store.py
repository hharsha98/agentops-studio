from __future__ import annotations

import json
import sqlite3
import threading
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

from .models import RunRecord, TraceSpan


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class RunStore:
    """Thread-safe run store. Memory by default; SQLite when given a path."""

    def __init__(self, db_path: str | None = None) -> None:
        self._lock = threading.RLock()
        self._db_path = db_path or None
        self._runs: dict[str, RunRecord] = {}
        self._spans: dict[str, list[TraceSpan]] = {}
        if self._db_path:
            path = Path(self._db_path)
            path.parent.mkdir(parents=True, exist_ok=True)
            self._init_db()

    def persistence(self) -> str:
        return "sqlite" if self._db_path else "memory"

    def _connect(self) -> sqlite3.Connection:
        assert self._db_path
        conn = sqlite3.connect(self._db_path, timeout=10)
        conn.row_factory = sqlite3.Row
        return conn

    @contextmanager
    def _db(self):
        conn = self._connect()
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def _init_db(self) -> None:
        with self._lock, self._db() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS runs (
                    id TEXT PRIMARY KEY,
                    created_at TEXT NOT NULL,
                    payload TEXT NOT NULL
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS spans (
                    id TEXT PRIMARY KEY,
                    run_id TEXT NOT NULL,
                    started_at TEXT NOT NULL,
                    payload TEXT NOT NULL
                )
                """
            )

    def upsert_run(self, run: RunRecord) -> RunRecord:
        with self._lock:
            if not self._db_path:
                self._runs[run.id] = run
                return run
            payload = run.model_dump(mode="json")
            with self._db() as conn:
                conn.execute(
                    """
                    INSERT INTO runs (id, created_at, payload)
                    VALUES (?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        created_at = excluded.created_at,
                        payload = excluded.payload
                    """,
                    (run.id, str(payload["created_at"]), json.dumps(payload)),
                )
            return run

    def get_run(self, run_id: str) -> RunRecord | None:
        with self._lock:
            if not self._db_path:
                return self._runs.get(run_id)
            with self._db() as conn:
                row = conn.execute("SELECT payload FROM runs WHERE id = ?", (run_id,)).fetchone()
            if row is None:
                return None
            return RunRecord.model_validate(json.loads(row["payload"]))

    def list_runs(self) -> list[RunRecord]:
        with self._lock:
            if not self._db_path:
                return sorted(self._runs.values(), key=lambda r: r.created_at, reverse=True)
            with self._db() as conn:
                rows = conn.execute("SELECT payload FROM runs ORDER BY created_at DESC").fetchall()
            return sorted(
                (RunRecord.model_validate(json.loads(row["payload"])) for row in rows),
                key=lambda run: run.created_at,
                reverse=True,
            )

    def add_span(self, span: TraceSpan) -> TraceSpan:
        with self._lock:
            if not self._db_path:
                self._spans.setdefault(span.run_id, []).append(span)
                return span
            payload = span.model_dump(mode="json")
            with self._db() as conn:
                conn.execute(
                    """
                    INSERT INTO spans (id, run_id, started_at, payload)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        run_id = excluded.run_id,
                        started_at = excluded.started_at,
                        payload = excluded.payload
                    """,
                    (span.id, span.run_id, str(payload["started_at"]), json.dumps(payload)),
                )
            return span

    def list_spans(self, run_id: str | None = None) -> list[TraceSpan]:
        with self._lock:
            if not self._db_path:
                if run_id:
                    return list(self._spans.get(run_id, []))
                spans: list[TraceSpan] = []
                for items in self._spans.values():
                    spans.extend(items)
                return sorted(spans, key=lambda s: s.started_at, reverse=True)
            sql = "SELECT payload FROM spans"
            params: tuple[str, ...] = ()
            if run_id:
                sql += " WHERE run_id = ?"
                params = (run_id,)
            sql += " ORDER BY started_at DESC"
            with self._db() as conn:
                rows = conn.execute(sql, params).fetchall()
            spans = [TraceSpan.model_validate(json.loads(row["payload"])) for row in rows]
            if run_id:
                spans.sort(key=lambda span: span.started_at)
            else:
                spans.sort(key=lambda span: span.started_at, reverse=True)
            return spans

    def counts(self) -> dict[str, int]:
        with self._lock:
            runs = self.list_runs() if self._db_path else list(self._runs.values())
            by_status: dict[str, int] = {}
            for run in runs:
                by_status[run.status.value] = by_status.get(run.status.value, 0) + 1
            if self._db_path:
                with self._db() as conn:
                    span_count = conn.execute("SELECT COUNT(*) AS n FROM spans").fetchone()["n"]
            else:
                span_count = sum(len(v) for v in self._spans.values())
            return {
                "runs": len(runs),
                "spans": int(span_count),
                **{f"status_{k}": v for k, v in by_status.items()},
            }


def _store_from_settings() -> RunStore:
    from .config import settings

    return RunStore(settings.run_db_path.strip() or None)


store = _store_from_settings()
