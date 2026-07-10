#!/usr/bin/env python3
"""Agent outcome evaluation — mirrors Reticle agent test assertions against live API."""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

API_BASE = os.environ.get("AGENTOPS_API_BASE", "http://localhost:8001")
REPORT_DIR = Path(__file__).resolve().parents[1] / ".cursor" / "eval-reports"


@dataclass
class Check:
    name: str
    passed: bool
    detail: str


def request(method: str, path: str, payload: dict | None = None) -> dict:
    data = None
    headers = {"Content-Type": "application/json"}
    if payload is not None:
        data = json.dumps(payload).encode()
    req = urllib.request.Request(f"{API_BASE}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=15) as response:
        return json.loads(response.read().decode())


def check_replay_run() -> Check:
    body = request(
        "POST",
        "/runs/replay",
        {
            "workflow_id": "executive-daily-brief",
            "goal": "Summarize support risks, revenue signals, and delivery blockers for leadership.",
        },
    )
    ok = body["workflow_id"] == "executive-daily-brief" and any(
        event["type"] == "run_started" for event in body["trace"]
    )
    return Check("replay_run_created", ok, f"run_id={body['id']} status={body['status']}")


def check_advance_and_approve() -> Check:
    created = request(
        "POST",
        "/runs/replay",
        {
            "workflow_id": "executive-daily-brief",
            "goal": "Leadership brief for autonomous eval cycle.",
        },
    )
    run_id = created["id"]
    for _ in range(3):
        request("POST", f"/runs/{run_id}/advance")
    approved = request("POST", f"/runs/{run_id}/approve")
    ok = approved["status"] == "done"
    return Check("advance_and_approve", ok, f"run_id={run_id} final_status={approved['status']}")


def check_benchmark_after_approval() -> Check:
    report = request("GET", "/benchmarks")
    categories = {item["id"] for item in report["categories"]}
    required = {"workflow_success", "citation_quality", "approval_safety", "cost_control", "traceability"}
    ok = required.issubset(categories) and report["average_overall_score"] >= 0
    return Check(
        "benchmark_report",
        ok,
        f"avg={report['average_overall_score']} categories={sorted(categories)}",
    )


def check_knowledge_search() -> Check:
    report = request("GET", "/knowledge/search?query=support+approval")
    ok = report["total"] >= 1 and all("citation" in item for item in report["results"])
    return Check("knowledge_search", ok, f"total={report['total']}")


def check_platform_ready() -> Check:
    ready = request("GET", "/ready")
    ok = ready["status"] == "ready"
    return Check("api_ready", ok, str(ready))


def main() -> int:
    checks: list[Check] = []
    try:
        checks = [
            check_platform_ready(),
            check_replay_run(),
            check_advance_and_approve(),
            check_benchmark_after_approval(),
            check_knowledge_search(),
        ]
    except urllib.error.URLError as error:
        print(f"API unreachable at {API_BASE}: {error}")
        print("Start API: cd apps/api && source .venv/bin/activate && uvicorn app.main:app --port 8000")
        return 1

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    report = {
        "timestamp": datetime.now(UTC).isoformat(),
        "api_base": API_BASE,
        "passed": sum(1 for item in checks if item.passed),
        "failed": sum(1 for item in checks if not item.passed),
        "checks": [{"name": item.name, "passed": item.passed, "detail": item.detail} for item in checks],
    }
    report_path = REPORT_DIR / f"cycle-{datetime.now(UTC).strftime('%Y%m%d-%H%M%S')}.json"
    report_path.write_text(json.dumps(report, indent=2))

    for item in checks:
        status = "PASS" if item.passed else "FAIL"
        print(f"[{status}] {item.name}: {item.detail}")

    print(f"\nReport: {report_path}")
    return 0 if report["failed"] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
