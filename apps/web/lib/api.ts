// Same-origin `/api` is the production default (Next route handler or Caddy).
// Set NEXT_PUBLIC_API_URL to an absolute origin only when the browser must
// call the API host directly — that value is baked in at `next build`.
const DEFAULT_API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "/api";

export function apiBase(): string {
  return DEFAULT_API_BASE.replace(/\/$/, "");
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    },
    cache: "no-store"
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `API ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export type PlatformSummary = {
  name: string;
  product: string;
  complements: string;
  agents: number;
  workflows: number;
  knowledge_documents: number;
  mcp_tools: number;
  runs: number;
  cloud_paths: string[];
  model_gateway: string;
  public_demo_mode: boolean;
  demo_public: boolean;
  public_host: string;
  distinct_from: string;
  capabilities: string[];
};

export type Workflow = {
  id: string;
  title: string;
  description: string;
  agents: string[];
  outcome: string;
  requires_approval: boolean;
};

export type RunRecord = {
  id: string;
  workflow_id: string;
  workflow_title: string;
  goal: string;
  status: "backlog" | "running" | "approval" | "failed" | "done";
  created_at: string;
  updated_at: string;
  steps: Array<{
    agent: string;
    role: string;
    summary: string;
    citations: Array<{ source_id: string; title: string; excerpt: string; score: number }>;
    tool_calls: string[];
    artifact?: string | null;
  }>;
  artifact?: string | null;
  citations: Array<{ source_id: string; title: string; excerpt: string; score: number }>;
  error?: string | null;
  mode: string;
  seeded?: boolean;
};

export type TraceSpan = {
  id: string;
  run_id: string;
  parent_id?: string | null;
  name: string;
  kind: string;
  status: string;
  started_at: string;
  ended_at?: string | null;
  duration_ms?: number | null;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
};

export type KnowledgeDocument = {
  id: string;
  title: string;
  path: string;
  source_type: string;
  chunk_count: number;
  preview: string;
};

export type McpTool = {
  name: string;
  description: string;
  category: string;
  sandbox: boolean;
  status: string;
};

export const api = {
  platform: () => apiFetch<PlatformSummary>("/platform"),
  workflows: () => apiFetch<{ workflows: Workflow[] }>("/workflows"),
  runs: () =>
    apiFetch<{
      runs: RunRecord[];
      lanes: Record<string, RunRecord[]>;
    }>("/runs"),
  createRun: (workflow_id: string, goal?: string) =>
    apiFetch<RunRecord>("/runs", {
      method: "POST",
      body: JSON.stringify({ workflow_id, goal })
    }),
  getRun: (id: string) =>
    apiFetch<{ run: RunRecord; spans: TraceSpan[] }>(`/runs/${id}`),
  approveRun: (id: string) =>
    apiFetch<RunRecord>(`/runs/${id}/approve`, { method: "POST" }),
  traces: (runId?: string) =>
    apiFetch<{ spans: TraceSpan[]; count: number }>(
      runId ? `/traces?run_id=${encodeURIComponent(runId)}` : "/traces"
    ),
  knowledge: () =>
    apiFetch<{ documents: KnowledgeDocument[]; chunk_count: number }>("/knowledge"),
  queryKnowledge: (query: string, top_k = 3) =>
    apiFetch<{
      query: string;
      hits: Array<{ id: string; document_id: string; title: string; text: string; score: number }>;
    }>("/knowledge/query", {
      method: "POST",
      body: JSON.stringify({ query, top_k })
    }),
  mcpTools: () => apiFetch<{ tools: McpTool[] }>("/mcp/tools"),
  invokeTool: (name: string, arguments_: Record<string, unknown> = {}) =>
    apiFetch<{ ok: boolean; result?: unknown; error?: string }>(
      `/mcp/tools/${encodeURIComponent(name)}/invoke`,
      {
        method: "POST",
        body: JSON.stringify({ arguments: arguments_ })
      }
    )
};
