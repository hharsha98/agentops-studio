import replayData from "../../../demo-data/replay-runs.json";
import knowledgeData from "../../../demo-data/knowledge-base.json";

export type RunStatus = "backlog" | "running" | "approval" | "done" | "failed";
export type RiskLevel = "low" | "medium" | "high";

export type WorkflowTemplate = {
  id: string;
  name: string;
  description: string;
  agents: string[];
  artifact_type: string;
  estimated_minutes: number;
  risk_level: RiskLevel;
};

export type RunTask = {
  id: string;
  title: string;
  agent: string;
  status: RunStatus;
  priority: "low" | "medium" | "high";
  depends_on: string[];
  artifact: string;
};

export type RunTraceEvent = {
  id: string;
  timestamp: string;
  type: string;
  title: string;
  detail: string;
  agent: string;
};

export type RunArtifact = {
  id: string;
  type: string;
  title: string;
  summary: string;
  citations: string[];
  requires_approval: boolean;
};

export type AgentRun = {
  id: string;
  workflow_id: string;
  title: string;
  goal: string;
  status: RunStatus;
  started_at: string;
  completed_at: string | null;
  agents: string[];
  metrics: {
    tokens: number;
    tool_calls: number;
    citations: number;
    estimated_cost_usd: number;
  };
  tasks: RunTask[];
  trace: RunTraceEvent[];
  artifacts: RunArtifact[];
};

export type RunSummary = Pick<
  AgentRun,
  "id" | "workflow_id" | "title" | "goal" | "status" | "started_at" | "completed_at" | "agents"
> & {
  tasks_total: number;
  artifacts_total: number;
  tokens: number;
  estimated_cost_usd: number;
};

type RunListResponse = {
  total: number;
  runs: RunSummary[];
};

type WorkflowListResponse = {
  total: number;
  workflows: WorkflowTemplate[];
};

export type ReplayRunInput = {
  workflow_id: string;
  goal: string;
};

export type KnowledgeDocumentSummary = {
  id: string;
  title: string;
  source_type: string;
  owner: string;
  chunks_total: number;
  tags: string[];
};

export type KnowledgeSearchResult = {
  chunk_id: string;
  document_id: string;
  document_title: string;
  heading: string;
  content: string;
  citation: string;
  score: number;
  tags: string[];
};

type KnowledgeDocumentListResponse = {
  total: number;
  documents: KnowledgeDocumentSummary[];
};

type KnowledgeSearchResponse = {
  query: string;
  total: number;
  results: KnowledgeSearchResult[];
};

export type BenchmarkCategory = {
  id: string;
  label: string;
  average_score: number;
  description: string;
};

export type RunBenchmarkScore = {
  run_id: string;
  title: string;
  status: RunStatus;
  workflow_success: number;
  citation_quality: number;
  approval_safety: number;
  cost_control: number;
  traceability: number;
  overall_score: number;
  notes: string[];
};

export type BenchmarkReport = {
  scenario_count: number;
  runs_evaluated: number;
  average_overall_score: number;
  categories: BenchmarkCategory[];
  run_scores: RunBenchmarkScore[];
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const FALLBACK_RUNS = replayData.runs as AgentRun[];
const FALLBACK_WORKFLOWS = replayData.workflows as WorkflowTemplate[];
const FALLBACK_KNOWLEDGE_DOCUMENTS = knowledgeData.documents.map((document) => ({
  id: document.id,
  title: document.title,
  source_type: document.source_type,
  owner: document.owner,
  chunks_total: document.chunks.length,
  tags: Array.from(new Set(document.chunks.flatMap((chunk) => chunk.tags))).sort()
})) satisfies KnowledgeDocumentSummary[];

function summarizeRun(run: AgentRun): RunSummary {
  return {
    id: run.id,
    workflow_id: run.workflow_id,
    title: run.title,
    goal: run.goal,
    status: run.status,
    started_at: run.started_at,
    completed_at: run.completed_at,
    agents: run.agents,
    tasks_total: run.tasks.length,
    artifacts_total: run.artifacts.length,
    tokens: run.metrics.tokens,
    estimated_cost_usd: run.metrics.estimated_cost_usd
  };
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(900)
    });

    if (!response.ok) {
      return null;
    }

    return await response.json() as T;
  } catch {
    return null;
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(1800)
    });

    if (!response.ok) {
      return null;
    }

    return await response.json() as T;
  } catch {
    return null;
  }
}

export async function getRuns(): Promise<RunListResponse> {
  const apiResponse = await fetchJson<RunListResponse>("/runs");
  if (apiResponse) {
    return apiResponse;
  }

  const runs = FALLBACK_RUNS.map(summarizeRun);
  return { total: runs.length, runs };
}

export async function getRun(runId: string): Promise<AgentRun | null> {
  const apiResponse = await fetchJson<AgentRun>(`/runs/${runId}`);
  if (apiResponse) {
    return apiResponse;
  }

  return FALLBACK_RUNS.find((run) => run.id === runId) ?? null;
}

export async function getWorkflows(): Promise<WorkflowListResponse> {
  const apiResponse = await fetchJson<WorkflowListResponse>("/workflows");
  if (apiResponse) {
    return apiResponse;
  }

  return { total: FALLBACK_WORKFLOWS.length, workflows: FALLBACK_WORKFLOWS };
}

export async function startReplay(input: ReplayRunInput): Promise<AgentRun | null> {
  return postJson<AgentRun>("/runs/replay", input);
}

export async function advanceRun(runId: string): Promise<AgentRun | null> {
  return postJson<AgentRun>(`/runs/${runId}/advance`, {});
}

export async function approveRun(runId: string): Promise<AgentRun | null> {
  return postJson<AgentRun>(`/runs/${runId}/approve`, {});
}

export async function getKnowledgeDocuments(): Promise<KnowledgeDocumentListResponse> {
  const apiResponse = await fetchJson<KnowledgeDocumentListResponse>("/knowledge/documents");
  if (apiResponse) {
    return apiResponse;
  }

  return {
    total: FALLBACK_KNOWLEDGE_DOCUMENTS.length,
    documents: FALLBACK_KNOWLEDGE_DOCUMENTS
  };
}

export async function searchKnowledge(query: string): Promise<KnowledgeSearchResponse> {
  const apiResponse = await fetchJson<KnowledgeSearchResponse>(`/knowledge/search?query=${encodeURIComponent(query)}`);
  if (apiResponse) {
    return apiResponse;
  }

  const tokens = new Set(query.toLowerCase().match(/[a-z0-9]+/g) ?? []);
  const results = knowledgeData.documents
    .flatMap((document) => document.chunks.map((chunk) => {
      const searchable = [document.title, chunk.heading, chunk.content, ...chunk.tags].join(" ").toLowerCase();
      const score = Array.from(tokens).filter((token) => token.length > 2 && searchable.includes(token)).length;
      return {
        chunk_id: chunk.id,
        document_id: document.id,
        document_title: document.title,
        heading: chunk.heading,
        content: chunk.content,
        citation: `${document.title} / ${chunk.heading}`,
        score,
        tags: chunk.tags
      };
    }))
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);

  return { query, total: results.length, results };
}

function scoreFallbackRun(run: AgentRun): RunBenchmarkScore {
  const workflow_success = run.status === "done" ? 100 : run.status === "approval" ? 82 : run.status === "running" ? 58 : 35;
  const citation_quality = Math.min(100, (run.metrics.citations + run.artifacts.reduce((sum, artifact) => sum + artifact.citations.length, 0)) * 12);
  const approval_safety = run.trace.some((event) => event.type === "approval_completed")
    ? 100
    : run.trace.some((event) => event.type === "approval_required") || run.artifacts.some((artifact) => artifact.requires_approval)
      ? 92
      : run.status === "running"
        ? 76
        : 70;
  const cost_control = run.metrics.estimated_cost_usd <= 0.25 ? 100 : run.metrics.estimated_cost_usd <= 0.5 ? 88 : run.metrics.estimated_cost_usd <= 0.75 ? 76 : 60;
  const traceability = Math.min(100, run.trace.length * 18 + run.artifacts.length * 12);
  const overall_score = Math.round((workflow_success + citation_quality + approval_safety + cost_control + traceability) / 5);

  return {
    run_id: run.id,
    title: run.title,
    status: run.status,
    workflow_success,
    citation_quality,
    approval_safety,
    cost_control,
    traceability,
    overall_score,
    notes: [
      `${run.trace.length} trace events inspected`,
      `${run.artifacts.length} artifacts inspected`,
      `$${run.metrics.estimated_cost_usd.toFixed(2)} estimated run cost`
    ]
  };
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export async function getBenchmarks(): Promise<BenchmarkReport> {
  const apiResponse = await fetchJson<BenchmarkReport>("/benchmarks");
  if (apiResponse) {
    return apiResponse;
  }

  const run_scores = FALLBACK_RUNS.map(scoreFallbackRun);
  const categories: BenchmarkCategory[] = [
    ["workflow_success", "Workflow success", "Rewards completed runs and partially credits runs paused for approval."],
    ["citation_quality", "Citation quality", "Measures whether artifacts and metrics include cited evidence."],
    ["approval_safety", "Approval safety", "Checks whether risky workflow outcomes pause for review and record approval."],
    ["cost_control", "Cost control", "Scores runs against estimated token and tool cost targets."],
    ["traceability", "Traceability", "Measures whether the run leaves enough trace and artifact evidence to debug."]
  ].map(([id, label, description]) => ({
    id,
    label,
    description,
    average_score: average(run_scores.map((score) => score[id as keyof RunBenchmarkScore] as number))
  }));

  return {
    scenario_count: 50,
    runs_evaluated: run_scores.length,
    average_overall_score: average(run_scores.map((score) => score.overall_score)),
    categories,
    run_scores
  };
}
