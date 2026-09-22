from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class RunStatus(str, Enum):
    backlog = "backlog"
    running = "running"
    approval = "approval"
    failed = "failed"
    done = "done"


class SpanKind(str, Enum):
    orchestrator = "orchestrator"
    agent = "agent"
    tool = "tool"
    rag = "rag"
    model = "model"
    approval = "approval"
    artifact = "artifact"


class Citation(BaseModel):
    source_id: str
    title: str
    excerpt: str
    score: float = 0.0


class TraceSpan(BaseModel):
    id: str
    run_id: str
    parent_id: str | None = None
    name: str
    kind: SpanKind
    status: str = "ok"
    started_at: datetime
    ended_at: datetime | None = None
    duration_ms: int | None = None
    input: dict[str, Any] = Field(default_factory=dict)
    output: dict[str, Any] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)


class AgentStepResult(BaseModel):
    agent: str
    role: str
    summary: str
    citations: list[Citation] = Field(default_factory=list)
    tool_calls: list[str] = Field(default_factory=list)
    artifact: str | None = None


class RunRecord(BaseModel):
    id: str
    workflow_id: str
    workflow_title: str
    goal: str
    status: RunStatus
    created_at: datetime
    updated_at: datetime
    steps: list[AgentStepResult] = Field(default_factory=list)
    artifact: str | None = None
    citations: list[Citation] = Field(default_factory=list)
    error: str | None = None
    mode: str = "deterministic"
    seeded: bool = False


class WorkflowDefinition(BaseModel):
    id: str
    title: str
    description: str
    agents: list[str]
    outcome: str
    requires_approval: bool = False


class KnowledgeDocument(BaseModel):
    id: str
    title: str
    path: str
    source_type: str
    chunk_count: int
    preview: str


class KnowledgeChunk(BaseModel):
    id: str
    document_id: str
    title: str
    text: str
    score: float = 0.0


class McpTool(BaseModel):
    name: str
    description: str
    category: str
    sandbox: bool = True
    status: str = "ready"
    input_schema: dict[str, Any] = Field(default_factory=dict)


class PlatformSummary(BaseModel):
    name: str
    product: str
    complements: str
    agents: int
    workflows: int
    knowledge_documents: int
    mcp_tools: int
    runs: int
    cloud_paths: list[str]
    model_gateway: str
    public_demo_mode: bool
    demo_public: bool
    public_host: str
    distinct_from: str
    capabilities: list[str]


class CreateRunRequest(BaseModel):
    workflow_id: str
    goal: str | None = None


class RagQueryRequest(BaseModel):
    query: str
    top_k: int = 3


class ToolInvokeRequest(BaseModel):
    arguments: dict[str, Any] = Field(default_factory=dict)
