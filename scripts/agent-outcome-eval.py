#!/usr/bin/env python3
"""Agent outcome evaluation — mirrors Reticle agent test assertions against live API."""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

API_BASE = os.environ.get("AGENTOPS_API_BASE", "http://localhost:8001")
REPORT_DIR = Path(__file__).resolve().parents[1] / ".cursor" / "eval-reports"
WORKFLOW_IDS = ("executive-daily-brief", "support-triage", "research-report")


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
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode())


def check_platform_ready() -> Check:
    ready = request("GET", "/ready")
    ok = ready["status"] == "ready" and ready["checks"].get("database") == "ok"
    return Check("api_ready", ok, str(ready))


def check_redis_reported() -> Check:
    ready = request("GET", "/ready")
    redis_status = ready.get("checks", {}).get("redis")
    ok = redis_status in {"ok", "unavailable"}
    return Check("redis_ready_probe", ok, f"redis={redis_status}")


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


def check_all_workflow_replays() -> Check:
    created_ids: list[str] = []
    for workflow_id in WORKFLOW_IDS:
        body = request(
            "POST",
            "/runs/replay",
            {"workflow_id": workflow_id, "goal": f"Autonomous eval replay for {workflow_id}."},
        )
        if body.get("workflow_id") != workflow_id:
            return Check("all_workflow_replays", False, f"failed on {workflow_id}")
        created_ids.append(body["id"])
    return Check("all_workflow_replays", True, f"workflows={list(WORKFLOW_IDS)} runs={created_ids}")


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


def check_worker_job_lifecycle() -> Check:
    created = request(
        "POST",
        "/runs/replay",
        {
            "workflow_id": "support-triage",
            "goal": "Worker queue should advance support triage autonomously.",
        },
    )
    run_id = created["id"]
    try:
        job = request("POST", f"/runs/{run_id}/jobs")
    except urllib.error.HTTPError as error:
        if error.code == 503:
            return Check("worker_job_lifecycle", False, "worker queue unavailable (start Redis + rq worker)")
        raise

    job_id = job["id"]
    terminal = {"waiting_for_approval", "completed", "failed"}
    last_status = job["status"]
    for _ in range(40):
        polled = request("GET", f"/jobs/{job_id}")
        last_status = polled["status"]
        if last_status in terminal:
            run = request("GET", f"/runs/{run_id}")
            ok = last_status in {"waiting_for_approval", "completed"} and run["status"] in {
                "approval",
                "done",
                "running",
            }
            return Check(
                "worker_job_lifecycle",
                ok,
                f"job_id={job_id} job_status={last_status} run_status={run['status']}",
            )
        time.sleep(0.5)

    return Check("worker_job_lifecycle", False, f"job_id={job_id} timed out at status={last_status}")


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


def check_workflows_catalog() -> Check:
    report = request("GET", "/workflows")
    ids = {item["id"] for item in report["workflows"]}
    ok = set(WORKFLOW_IDS).issubset(ids)
    return Check("workflows_catalog", ok, f"total={report['total']} ids={sorted(ids)}")


def check_agent_surfaces() -> Check:
    research = request("GET", "/research/overview")
    mcp = request("GET", "/mcp/tools")
    traces = request("GET", "/traces/summary")
    ok = (
        research.get("workflow_id") == "research-report"
        and mcp.get("total", 0) >= 5
        and traces.get("events_total", 0) >= 1
    )
    return Check(
        "agent_surfaces",
        ok,
        f"research_runs={research.get('runs_total')} mcp_tools={mcp.get('total')} trace_events={traces.get('events_total')}",
    )


def check_live_llm_trace() -> Check:
    if os.environ.get("ENABLE_LIVE_LLM", "").lower() not in {"1", "true", "yes"}:
        return Check("live_llm_trace", True, "skipped (ENABLE_LIVE_LLM off)")

    created = request(
        "POST",
        "/runs/replay",
        {"workflow_id": "research-report", "goal": "Live LLM trace check for autonomous eval."},
    )
    run_id = created["id"]
    advanced = request("POST", f"/runs/{run_id}/advance")
    trace_types = {event["type"] for event in advanced["trace"]}
    ok = "llm_completion" in trace_types
    return Check("live_llm_trace", ok, f"trace_types={sorted(trace_types)}")


def main() -> int:
    checks: list[Check] = []
    try:
        checks = [
            check_platform_ready(),
            check_redis_reported(),
            check_workflows_catalog(),
            check_replay_run(),
            check_all_workflow_replays(),
            check_advance_and_approve(),
            check_worker_job_lifecycle(),
            check_benchmark_after_approval(),
            check_knowledge_search(),
            check_agent_surfaces(),
            check_live_llm_trace(),
        ]
    except urllib.error.URLError as error:
        print(f"API unreachable at {API_BASE}: {error}")
        print("Start API: cd apps/api && source .venv/bin/activate && uvicorn app.main:app --port 8001")
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
    print(f"Summary: {report['passed']}/{len(checks)} checks passed")
    return 0 if report["failed"] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
