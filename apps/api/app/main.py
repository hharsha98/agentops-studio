from typing import Annotated

from fastapi import FastAPI, HTTPException, Query

from .agent_surfaces import build_mcp_tools, build_research_overview, build_traces_summary
from .benchmarks import build_benchmark_report
from .config import settings
from .knowledge_base import list_documents, search_knowledge
from .job_dispatcher import WorkerQueueUnavailable, enqueue_worker_job
from .readiness import redis_is_ready
from .replay_store import approve_run, advance_run, create_replay_run, get_run, list_runs, list_workflows, storage_is_ready
from .schemas import (
    AgentRun,
    BenchmarkReport,
    KnowledgeDocumentListResponse,
    KnowledgeSearchResponse,
    McpToolListResponse,
    ReplayRunRequest,
    ResearchOverviewResponse,
    RunListResponse,
    TraceSummaryResponse,
    WorkerJob,
    WorkflowListResponse,
)
from .worker_queue import create_worker_job, get_worker_job

app = FastAPI(title=settings.app_name)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "agentops-api"}


@app.get("/ready")
def ready() -> dict[str, object]:
    checks: dict[str, str] = {}
    if not storage_is_ready():
        checks["database"] = "unavailable"
    else:
        checks["database"] = "ok"

    redis_status = "ok" if redis_is_ready() else "unavailable"
    checks["redis"] = redis_status

    if checks["database"] != "ok":
        raise HTTPException(status_code=503, detail="Database is not ready")
    if settings.require_redis_for_ready and redis_status != "ok":
        raise HTTPException(status_code=503, detail="Worker queue is not ready")
    return {"status": "ready", "checks": checks}


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


@app.post("/runs/{run_id}/approve", response_model=AgentRun)
def approve_replay_run(run_id: str) -> AgentRun:
    existing_run = get_run(run_id)
    if existing_run is None:
        raise HTTPException(status_code=404, detail="Run not found")
    if existing_run.status != "approval":
        raise HTTPException(status_code=409, detail="Run is not waiting for approval")

    run = approve_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@app.post("/runs/{run_id}/jobs", response_model=WorkerJob, status_code=201)
def create_run_worker_job(run_id: str) -> WorkerJob:
    job = create_worker_job(run_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Run not found")
    try:
        enqueue_worker_job(job.id)
    except WorkerQueueUnavailable as exc:
        raise HTTPException(status_code=503, detail="Worker queue is unavailable") from exc
    return job


@app.get("/jobs/{job_id}", response_model=WorkerJob)
def worker_job_detail(job_id: str) -> WorkerJob:
    job = get_worker_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Worker job not found")
    return job


@app.get("/workflows", response_model=WorkflowListResponse)
def workflows() -> WorkflowListResponse:
    workflow_templates = list_workflows()
    return WorkflowListResponse(total=len(workflow_templates), workflows=workflow_templates)


@app.get("/knowledge/documents", response_model=KnowledgeDocumentListResponse)
def knowledge_documents() -> KnowledgeDocumentListResponse:
    return list_documents()


@app.get("/knowledge/search", response_model=KnowledgeSearchResponse)
def knowledge_search(query: Annotated[str, Query(min_length=1, max_length=160)]) -> KnowledgeSearchResponse:
    stripped_query = query.strip()
    if not stripped_query:
        raise HTTPException(status_code=422, detail="Search query is required")
    return search_knowledge(stripped_query)


@app.get("/benchmarks", response_model=BenchmarkReport)
def benchmarks() -> BenchmarkReport:
    return build_benchmark_report()


@app.get("/research/overview", response_model=ResearchOverviewResponse)
def research_overview() -> ResearchOverviewResponse:
    return build_research_overview()


@app.get("/mcp/tools", response_model=McpToolListResponse)
def mcp_tools() -> McpToolListResponse:
    return build_mcp_tools()


@app.get("/traces/summary", response_model=TraceSummaryResponse)
def traces_summary() -> TraceSummaryResponse:
    return build_traces_summary()
