from fastapi import FastAPI, HTTPException

from .config import settings
from .replay_store import advance_run, create_replay_run, get_run, list_runs, list_workflows
from .schemas import AgentRun, ReplayRunRequest, RunListResponse, WorkflowListResponse

app = FastAPI(title=settings.app_name)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "agentops-api"}


@app.get("/platform")
def platform() -> dict[str, object]:
    return {
        "name": "AgentOps Studio",
        "agents": 30,
        "workflows": 10,
        "cloud_paths": ["Docker", "k3d", "AWS EKS", "GCP GKE"],
        "model_gateway": settings.model_name,
        "public_demo_mode": settings.public_demo_mode,
    }


@app.get("/runs", response_model=RunListResponse)
def runs() -> RunListResponse:
    run_summaries = list_runs()
    return RunListResponse(total=len(run_summaries), runs=run_summaries)


@app.get("/runs/{run_id}", response_model=AgentRun)
def run_detail(run_id: str) -> AgentRun:
    run = get_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@app.post("/runs/replay", response_model=AgentRun, status_code=201)
def replay_run(request: ReplayRunRequest) -> AgentRun:
    run = create_replay_run(request)
    if run is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return run


@app.post("/runs/{run_id}/advance", response_model=AgentRun)
def advance_replay_run(run_id: str) -> AgentRun:
    run = advance_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@app.get("/workflows", response_model=WorkflowListResponse)
def workflows() -> WorkflowListResponse:
    workflow_templates = list_workflows()
    return WorkflowListResponse(total=len(workflow_templates), workflows=workflow_templates)
