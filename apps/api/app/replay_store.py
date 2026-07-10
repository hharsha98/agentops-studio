import json
from copy import deepcopy
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

from .config import settings
from .repository import RunRepository
from .schemas import AgentRun, ReplayRunRequest, RunArtifact, RunSummary, RunTraceEvent, WorkflowTemplate


DATA_PATH = Path(__file__).resolve().parents[3] / "demo-data" / "replay-runs.json"


def _load_seed_data() -> tuple[list[WorkflowTemplate], list[AgentRun]]:
    with DATA_PATH.open() as file:
        raw = json.load(file)

    workflows = [WorkflowTemplate.model_validate(item) for item in raw["workflows"]]
    runs = [AgentRun.model_validate(item) for item in raw["runs"]]
    return workflows, runs


WORKFLOWS, SEED_RUNS = _load_seed_data()
DEFAULT_REPOSITORY = RunRepository(settings.database_url, seed_runs=SEED_RUNS)


def summarize_run(run: AgentRun) -> RunSummary:
    return RunSummary(
        id=run.id,
        workflow_id=run.workflow_id,
        title=run.title,
        goal=run.goal,
        status=run.status,
        started_at=run.started_at,
        completed_at=run.completed_at,
        agents=run.agents,
        tasks_total=len(run.tasks),
        artifacts_total=len(run.artifacts),
        tokens=run.metrics.tokens,
        estimated_cost_usd=run.metrics.estimated_cost_usd,
    )


def list_runs() -> list[RunSummary]:
    return [summarize_run(run) for run in DEFAULT_REPOSITORY.list_runs()]


def get_run(run_id: str, *, repository: RunRepository = DEFAULT_REPOSITORY) -> AgentRun | None:
    return repository.get_run(run_id)


def list_workflows() -> list[WorkflowTemplate]:
    return WORKFLOWS


def get_workflow(workflow_id: str) -> WorkflowTemplate | None:
    return next((workflow for workflow in WORKFLOWS if workflow.id == workflow_id), None)


def create_replay_run(
    request: ReplayRunRequest,
    *,
    repository: RunRepository = DEFAULT_REPOSITORY,
) -> AgentRun | None:
    workflow = get_workflow(request.workflow_id)
    if workflow is None:
        return None

    started_at = datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    base_run = deepcopy(SEED_RUNS[0])
    replay_run = base_run.model_copy(
        update={
            "id": f"run-replay-{workflow.id}-{uuid4().hex[:8]}",
            "workflow_id": workflow.id,
            "title": workflow.name,
            "goal": request.goal,
            "status": "running",
            "started_at": started_at,
            "completed_at": None,
            "agents": workflow.agents,
        },
        deep=True,
    )

    replay_run.tasks[0].status = "running"
    replay_run.tasks[0].title = f"Start {workflow.name.lower()}"
    replay_run.tasks[0].agent = workflow.agents[0]
    for task in replay_run.tasks[1:]:
        task.status = "backlog"

    replay_run.trace[0].id = f"trace-{workflow.id}-started"
    replay_run.trace[0].timestamp = started_at
    replay_run.trace[0].type = "run_started"
    replay_run.trace[0].title = "Replay run started"
    replay_run.trace[0].detail = f"{workflow.name} replay started from workflow template."
    replay_run.trace[0].agent = workflow.agents[0]
    replay_run.trace = replay_run.trace[:1]
    replay_run.artifacts = []

    return repository.save_run(replay_run, newest=True)


def _now_iso() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _dependencies_are_done(run: AgentRun, dependency_ids: list[str]) -> bool:
    statuses = {task.id: task.status for task in run.tasks}
    return all(statuses.get(dependency_id) == "done" for dependency_id in dependency_ids)


def _append_trace(run: AgentRun, event_type: str, title: str, detail: str, agent: str) -> None:
    run.trace.append(
        RunTraceEvent(
            id=f"trace-{run.id}-{len(run.trace) + 1}",
            timestamp=_now_iso(),
            type=event_type,
            title=title,
            detail=detail,
            agent=agent,
        )
    )


def _approval_artifact(run: AgentRun) -> RunArtifact:
    return RunArtifact(
        id=f"artifact-{run.id}-approval",
        type="approval_brief",
        title=f"{run.title} approval brief",
        summary=f"{run.title} has completed automated preparation for: {run.goal}",
        citations=["agent-trace", "workflow-template", "retrieved-context"],
        requires_approval=True,
    )


def advance_run(run_id: str, *, repository: RunRepository = DEFAULT_REPOSITORY) -> AgentRun | None:
    run = get_run(run_id, repository=repository)
    if run is None:
        return None

    running_task = next((task for task in run.tasks if task.status == "running"), None)
    if running_task is None:
        return repository.save_run(run)

    running_task.status = "done"
    _append_trace(
        run,
        "task_completed",
        f"{running_task.title} completed",
        f"{running_task.agent} finished {running_task.artifact.lower()}.",
        running_task.agent,
    )

    next_task = next(
        (
            task
            for task in run.tasks
            if task.status == "backlog" and _dependencies_are_done(run, task.depends_on)
        ),
        None,
    )

    if next_task is None:
        run.status = "done"
        run.completed_at = _now_iso()
        _append_trace(
            run,
            "run_completed",
            "Run completed",
            "All workflow tasks completed.",
            running_task.agent,
        )
        return repository.save_run(run)

    if "approval" in next_task.id or "approve" in next_task.title.lower():
        next_task.status = "approval"
        run.status = "approval"
        if not run.artifacts:
            run.artifacts.append(_approval_artifact(run))
        _append_trace(
            run,
            "approval_required",
            "Human approval required",
            f"{next_task.agent} prepared an approval artifact before final delivery.",
            next_task.agent,
        )
        return repository.save_run(run)

    next_task.status = "running"
    run.status = "running"
    _append_trace(
        run,
        "task_started",
        f"{next_task.title} started",
        f"{next_task.agent} started {next_task.artifact.lower()}.",
        next_task.agent,
    )
    return repository.save_run(run)


def approve_run(run_id: str, *, repository: RunRepository = DEFAULT_REPOSITORY) -> AgentRun | None:
    run = get_run(run_id, repository=repository)
    if run is None:
        return None

    if run.status != "approval":
        return run

    for task in run.tasks:
        if task.status == "approval":
            task.status = "done"

    for artifact in run.artifacts:
        artifact.requires_approval = False

    run.status = "done"
    run.completed_at = _now_iso()
    _append_trace(
        run,
        "approval_completed",
        "Approval completed",
        "Human approval completed and the workflow outcome was released.",
        "Approval Desk",
    )
    return repository.save_run(run)
