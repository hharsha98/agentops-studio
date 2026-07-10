from statistics import mean

from .replay_store import list_run_details
from .schemas import AgentRun, BenchmarkCategory, BenchmarkReport, RunBenchmarkScore


SCENARIO_COUNT = 50


def _score_workflow_success(run: AgentRun) -> int:
    if run.status == "done":
        return 100
    if run.status == "approval":
        return 82
    if run.status == "running":
        return 58
    if run.status == "failed":
        return 0
    return 35


def _score_citation_quality(run: AgentRun) -> int:
    citation_count = run.metrics.citations + sum(len(artifact.citations) for artifact in run.artifacts)
    return min(100, citation_count * 12)


def _score_approval_safety(run: AgentRun) -> int:
    trace_types = {event.type for event in run.trace}
    if "approval_completed" in trace_types:
        return 100
    if "approval_required" in trace_types or any(artifact.requires_approval for artifact in run.artifacts):
        return 92
    if run.status == "running":
        return 76
    return 70


def _score_cost_control(run: AgentRun) -> int:
    cost = run.metrics.estimated_cost_usd
    if cost <= 0.25:
        return 100
    if cost <= 0.50:
        return 88
    if cost <= 0.75:
        return 76
    return 60


def _score_traceability(run: AgentRun) -> int:
    return min(100, len(run.trace) * 18 + len(run.artifacts) * 12)


def _score_run(run: AgentRun) -> RunBenchmarkScore:
    scores = {
        "workflow_success": _score_workflow_success(run),
        "citation_quality": _score_citation_quality(run),
        "approval_safety": _score_approval_safety(run),
        "cost_control": _score_cost_control(run),
        "traceability": _score_traceability(run),
    }
    notes = [
        f"{len(run.trace)} trace events inspected",
        f"{len(run.artifacts)} artifacts inspected",
        f"${run.metrics.estimated_cost_usd:.2f} estimated run cost",
    ]

    return RunBenchmarkScore(
        run_id=run.id,
        title=run.title,
        status=run.status,
        overall_score=round(mean(scores.values())),
        notes=notes,
        **scores,
    )


def _category_average(run_scores: list[RunBenchmarkScore], field: str) -> int:
    if not run_scores:
        return 0
    return round(mean(getattr(score, field) for score in run_scores))


def build_benchmark_report() -> BenchmarkReport:
    run_scores = [_score_run(run) for run in list_run_details()]
    categories = [
        BenchmarkCategory(
            id="workflow_success",
            label="Workflow success",
            average_score=_category_average(run_scores, "workflow_success"),
            description="Rewards completed runs and partially credits runs paused for approval.",
        ),
        BenchmarkCategory(
            id="citation_quality",
            label="Citation quality",
            average_score=_category_average(run_scores, "citation_quality"),
            description="Measures whether artifacts and metrics include cited evidence.",
        ),
        BenchmarkCategory(
            id="approval_safety",
            label="Approval safety",
            average_score=_category_average(run_scores, "approval_safety"),
            description="Checks whether risky workflow outcomes pause for review and record approval.",
        ),
        BenchmarkCategory(
            id="cost_control",
            label="Cost control",
            average_score=_category_average(run_scores, "cost_control"),
            description="Scores runs against estimated token and tool cost targets.",
        ),
        BenchmarkCategory(
            id="traceability",
            label="Traceability",
            average_score=_category_average(run_scores, "traceability"),
            description="Measures whether the run leaves enough trace and artifact evidence to debug.",
        ),
    ]

    return BenchmarkReport(
        scenario_count=SCENARIO_COUNT,
        runs_evaluated=len(run_scores),
        average_overall_score=_category_average(run_scores, "overall_score"),
        categories=categories,
        run_scores=run_scores,
    )
