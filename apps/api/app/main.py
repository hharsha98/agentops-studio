from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .llm import llm_gateway
from .mcp import mcp_registry
from .models import (
    CreateRunRequest,
    PlatformSummary,
    RagQueryRequest,
    ToolInvokeRequest,
)
from .orchestration import engine, list_workflows
from .rag import knowledge_index
from .seed import seed_public_demo
from .store import store


def _bootstrap_knowledge() -> None:
    knowledge_index.load(Path(settings.demo_data_dir))


@asynccontextmanager
async def lifespan(_app: FastAPI):
    _bootstrap_knowledge()
    llm_gateway.start_probe()
    if settings.demo_public:
        seeded = seed_public_demo()
        if seeded:
            print(f"DEMO_PUBLIC seeded {len(seeded)} showcase runs", flush=True)
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)
_bootstrap_knowledge()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list(),
    allow_origin_regex=settings.cors_origin_regex.strip() or None,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, object]:
    return {
        "status": "ok",
        "service": "agentops-api",
        "knowledge_documents": len(knowledge_index.documents),
        "mcp_tools": len(mcp_registry.list_tools()),
        "runs": store.counts().get("runs", 0),
        "demo_public": settings.demo_public,
        "public_demo_mode": settings.public_demo_mode,
        "persistence": store.persistence(),
        "llm": llm_gateway.status(),
    }


@app.get("/platform", response_model=PlatformSummary)
def platform() -> PlatformSummary:
    counts = store.counts()
    return PlatformSummary(
        name="AgentOps Studio",
        product="studio",
        complements=(
            "Agent Fleet is the separate Contabo-hosted product at "
            "https://agentfleet.169.58.185.43.sslip.io/. "
            "AgentOps Studio is this ops lab; its public demo target is "
            "https://agentops.169.58.185.43.sslip.io/."
        ),
        agents=6,
        workflows=len(list_workflows()),
        knowledge_documents=len(knowledge_index.documents),
        mcp_tools=len(mcp_registry.list_tools()),
        runs=counts.get("runs", 0),
        cloud_paths=[
            "Native local",
            "Contabo public demo",
            "Docker Compose (optional)",
            "k3d docs",
            "Terraform blueprints",
        ],
        model_gateway=str(llm_gateway.status()["base_host"]),
        llm=llm_gateway.status(),
        persistence=store.persistence(),
        public_demo_mode=settings.public_demo_mode,
        demo_public=settings.demo_public,
        public_host="https://agentops.169.58.185.43.sslip.io",
        distinct_from="https://agentfleet.169.58.185.43.sslip.io",
        capabilities=[
            "multi-agent orchestration",
            "RAG with citations",
            "MCP tool registry",
            "run traces",
            "approval gates",
            "omniroute gateway",
        ],
    )


@app.get("/workflows")
def workflows() -> dict[str, object]:
    return {"workflows": [w.model_dump() for w in list_workflows()]}


@app.get("/runs")
def list_runs() -> dict[str, object]:
    runs = store.list_runs()
    lanes = {
        "backlog": [],
        "running": [],
        "approval": [],
        "failed": [],
        "done": [],
    }
    for run in runs:
        lanes.setdefault(run.status.value, []).append(run.model_dump(mode="json"))
    return {"runs": [r.model_dump(mode="json") for r in runs], "lanes": lanes}


@app.post("/runs")
def create_run(body: CreateRunRequest) -> dict[str, object]:
    try:
        run = engine.start_run(body.workflow_id, body.goal)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return run.model_dump(mode="json")


@app.get("/runs/{run_id}")
def get_run(run_id: str) -> dict[str, object]:
    run = store.get_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Run not found")
    spans = [s.model_dump(mode="json") for s in store.list_spans(run_id)]
    return {"run": run.model_dump(mode="json"), "spans": spans}


@app.post("/runs/{run_id}/approve")
def approve_run(run_id: str) -> dict[str, object]:
    try:
        run = engine.approve_run(run_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return run.model_dump(mode="json")


@app.get("/traces")
def list_traces(run_id: str | None = None) -> dict[str, object]:
    spans = store.list_spans(run_id)
    return {"spans": [s.model_dump(mode="json") for s in spans], "count": len(spans)}


@app.get("/knowledge")
def list_knowledge() -> dict[str, object]:
    return {
        "documents": [d.model_dump() for d in knowledge_index.documents],
        "chunk_count": len(knowledge_index.chunks),
    }


@app.get("/knowledge/{document_id}")
def get_knowledge_document(document_id: str) -> dict[str, object]:
    document = next((doc for doc in knowledge_index.documents if doc.id == document_id), None)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    chunks = [chunk for chunk in knowledge_index.chunks if chunk.document_id == document_id]
    return {
        "document": document.model_dump(),
        "chunks": [chunk.model_dump() for chunk in chunks],
    }


@app.post("/knowledge/query")
def query_knowledge(body: RagQueryRequest) -> dict[str, object]:
    chunks = knowledge_index.retrieve(body.query, top_k=body.top_k)
    return {
        "query": body.query,
        "hits": [c.model_dump() for c in chunks],
    }


@app.get("/mcp/tools")
def list_mcp_tools() -> dict[str, object]:
    return {"tools": [t.model_dump() for t in mcp_registry.list_tools()]}


@app.post("/mcp/tools/{tool_name}/invoke")
def invoke_mcp_tool(tool_name: str, body: ToolInvokeRequest) -> dict[str, object]:
    if mcp_registry.get(tool_name) is None:
        raise HTTPException(status_code=404, detail=f"Unknown tool: {tool_name}")
    return mcp_registry.invoke(tool_name, body.arguments)
