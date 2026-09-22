"""Seed showcase runs for the public demo.

DEMO_PUBLIC (default on) executes real workflows at process start so the
first Dashboard / Runs / Traces visit already has an approval gate, a
finished run, citations, and spans. State stays in memory — one API worker.
"""

from __future__ import annotations

import logging

from .models import RunStatus
from .orchestration import engine
from .store import store

logger = logging.getLogger(__name__)

# Order matters: the executive brief is created last so it sorts first and
# stays in `approval` for the visitor to approve.
SEED_WORKFLOWS: tuple[tuple[str, RunStatus], ...] = (
    ("product-research", RunStatus.done),
    ("executive-daily-brief", RunStatus.approval),
)


def seed_public_demo() -> list[str]:
    """Execute showcase workflows once per process. Returns new run ids."""
    if store.counts().get("runs", 0) > 0:
        return []

    seeded_ids: list[str] = []
    for workflow_id, expected in SEED_WORKFLOWS:
        run = engine.start_run(workflow_id)
        if run.status != expected:
            raise RuntimeError(
                f"DEMO_PUBLIC seed for {workflow_id} expected {expected.value}, "
                f"got {run.status.value}: {run.error or 'no error'}"
            )
        if not run.citations:
            raise RuntimeError(f"DEMO_PUBLIC seed for {workflow_id} produced no citations")
        run.seeded = True
        store.upsert_run(run)
        seeded_ids.append(run.id)
        logger.info(
            "seeded %s run %s status=%s citations=%s",
            workflow_id,
            run.id,
            run.status.value,
            len(run.citations),
        )
    return seeded_ids
