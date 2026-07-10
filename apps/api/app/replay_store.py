import json
from copy import deepcopy
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

from .schemas import AgentRun, ReplayRunRequest, RunSummary, WorkflowTemplate


DATA_PATH = Path(__file__).resolve().parents[3] / "demo-data" / "replay-runs.json"


def _load_seed_data() -> tuple[list[WorkflowTemplate], list[AgentRun]]:
    with DATA_PATH.open() as file:
        raw = json.load(file)

    workflows = [WorkflowTemplate.model_validate(item) for item in raw["workflows"]]
    runs = [AgentRun.model_validate(item) for item in raw["runs"]]
    return workflows, runs


WORKFLOWS, RUNS = _load_seed_data()


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
    return [summarize_run(run) for run in RUNS]


def get_run(run_id: str) -> AgentRun | None:
    return next((run for run in RUNS if run.id == run_id), None)


def list_workflows() -> list[WorkflowTemplate]:
    return WORKFLOWS


def get_workflow(workflow_id: str) -> WorkflowTemplate | None:
    return next((workflow for workflow in WORKFLOWS if workflow.id == workflow_id), None)


def create_replay_run(request: ReplayRunRequest) -> AgentRun | None:
    workflow = get_workflow(request.workflow_id)
    if workflow is None:
        return None

    started_at = datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    base_run = deepcopy(RUNS[0])
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

    RUNS.insert(0, replay_run)
    return replay_run
