from typing import Literal

from pydantic import BaseModel, Field


RunStatus = Literal["backlog", "running", "approval", "done", "failed"]
Priority = Literal["low", "medium", "high"]
RiskLevel = Literal["low", "medium", "high"]


class WorkflowTemplate(BaseModel):
    id: str
    name: str
    description: str
    agents: list[str]
    artifact_type: str
    estimated_minutes: int
    risk_level: RiskLevel


class RunMetrics(BaseModel):
    tokens: int
    tool_calls: int
    citations: int
    estimated_cost_usd: float


class RunTask(BaseModel):
    id: str
    title: str
    agent: str
    status: RunStatus
    priority: Priority
    depends_on: list[str] = Field(default_factory=list)
    artifact: str


class RunTraceEvent(BaseModel):
    id: str
    timestamp: str
    type: str
    title: str
    detail: str
    agent: str


class RunArtifact(BaseModel):
    id: str
    type: str
    title: str
    summary: str
    citations: list[str]
    requires_approval: bool


class AgentRun(BaseModel):
    id: str
    workflow_id: str
    title: str
    goal: str
    status: RunStatus
    started_at: str
    completed_at: str | None
    agents: list[str]
    metrics: RunMetrics
    tasks: list[RunTask]
    trace: list[RunTraceEvent]
    artifacts: list[RunArtifact]


class RunSummary(BaseModel):
    id: str
    workflow_id: str
    title: str
    goal: str
    status: RunStatus
    started_at: str
    completed_at: str | None
    agents: list[str]
    tasks_total: int
    artifacts_total: int
    tokens: int
    estimated_cost_usd: float


class RunListResponse(BaseModel):
    total: int
    runs: list[RunSummary]


class WorkflowListResponse(BaseModel):
    total: int
    workflows: list[WorkflowTemplate]


class ReplayRunRequest(BaseModel):
    workflow_id: str
    goal: str = Field(min_length=8, max_length=500)


class KnowledgeChunk(BaseModel):
    id: str
    heading: str
    content: str
    tags: list[str] = Field(default_factory=list)


class KnowledgeDocument(BaseModel):
    id: str
    title: str
    source_type: str
    owner: str
    chunks: list[KnowledgeChunk]


class KnowledgeDocumentSummary(BaseModel):
    id: str
    title: str
    source_type: str
    owner: str
    chunks_total: int
    tags: list[str]


class KnowledgeDocumentListResponse(BaseModel):
    total: int
    documents: list[KnowledgeDocumentSummary]


class KnowledgeSearchResult(BaseModel):
    chunk_id: str
    document_id: str
    document_title: str
    heading: str
    content: str
    citation: str
    score: int
    tags: list[str]


class KnowledgeSearchResponse(BaseModel):
    query: str
    total: int
    results: list[KnowledgeSearchResult]
