import replayData from "../../../demo-data/replay-runs.json";

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const FALLBACK_RUNS = replayData.runs as AgentRun[];
const FALLBACK_WORKFLOWS = replayData.workflows as WorkflowTemplate[];

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
