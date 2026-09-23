from datetime import datetime, timezone

from app.models import RunRecord, RunStatus, SpanKind, TraceSpan
from app.store import RunStore


def _run(run_id: str) -> RunRecord:
    now = datetime.now(timezone.utc)
    return RunRecord(
        id=run_id,
        workflow_id="compliance-review",
        workflow_title="Compliance review",
        goal="Check policy",
        status=RunStatus.done,
        created_at=now,
        updated_at=now,
        artifact="note",
    )


def test_sqlite_orders_same_second_rows_by_real_time(tmp_path) -> None:
    store = RunStore(str(tmp_path / "order.sqlite"))
    older = _run("older")
    newer = _run("newer")
    older.created_at = datetime(2026, 9, 23, 10, 19, 18, tzinfo=timezone.utc)
    newer.created_at = datetime(2026, 9, 23, 10, 19, 18, 492771, tzinfo=timezone.utc)
    store.upsert_run(older)
    store.upsert_run(newer)
    assert [run.id for run in store.list_runs()] == ["newer", "older"]
    store = RunStore(str(tmp_path / "nested" / "studio.sqlite"))
    assert store.persistence() == "sqlite"
    store.upsert_run(_run("run-1"))
    span = TraceSpan(
        id="span-1",
        run_id="run-1",
        name="agent.compliance",
        kind=SpanKind.agent,
        started_at=datetime.now(timezone.utc),
    )
    store.add_span(span)
    assert store.get_run("run-1") is not None
    assert store.get_run("missing") is None
    assert store.counts()["runs"] == 1
    assert store.counts()["spans"] == 1
    assert store.list_spans("run-1")[0].name == "agent.compliance"

    reloaded = RunStore(str(tmp_path / "nested" / "studio.sqlite"))
    assert reloaded.list_runs()[0].id == "run-1"
    assert reloaded.list_spans()[0].id == "span-1"
