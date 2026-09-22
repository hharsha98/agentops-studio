"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { api, type PlatformSummary, type RunRecord, type Workflow } from "@/lib/api";

export function DemoConsole() {
  const [platform, setPlatform] = useState<PlatformSummary | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [selected, setSelected] = useState("executive-daily-brief");
  const [activeRun, setActiveRun] = useState<RunRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function refresh() {
    const [p, w, r] = await Promise.all([api.platform(), api.workflows(), api.runs()]);
    setPlatform(p);
    setWorkflows(w.workflows);
    setRuns(r.runs);
    setActiveRun((current) => {
      if (current) {
        return r.runs.find((run) => run.id === current.id) ?? current;
      }
      return r.runs.find((run) => run.status === "approval") ?? r.runs[0] ?? null;
    });
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [p, w, r] = await Promise.all([api.platform(), api.workflows(), api.runs()]);
        if (cancelled) return;
        setPlatform(p);
        setWorkflows(w.workflows);
        setRuns(r.runs);
        setActiveRun(
          (current) =>
            current ??
            r.runs.find((run) => run.status === "approval") ??
            r.runs[0] ??
            null
        );
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load demo");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function runWorkflow() {
    setError(null);
    startTransition(async () => {
      try {
        const run = await api.createRun(selected);
        setActiveRun(run);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Run failed");
      }
    });
  }

  function approve() {
    if (!activeRun) return;
    startTransition(async () => {
      try {
        const run = await api.approveRun(activeRun.id);
        setActiveRun(run);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Approve failed");
      }
    });
  }

  return (
    <div className="demo-console">
      <div className="metrics">
        <div className="metric">
          <span>Workflows</span>
          <strong>{platform?.workflows ?? "—"}</strong>
        </div>
        <div className="metric">
          <span>Knowledge docs</span>
          <strong>{platform?.knowledge_documents ?? "—"}</strong>
        </div>
        <div className="metric">
          <span>MCP tools</span>
          <strong>{platform?.mcp_tools ?? "—"}</strong>
        </div>
        <div className="metric">
          <span>Runs</span>
          <strong>{platform?.runs ?? runs.length}</strong>
        </div>
      </div>

      <div className="demo-controls">
        <label>
          <span className="eyebrow">Workflow</span>
          <select
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            disabled={pending}
          >
            {workflows.map((workflow) => (
              <option key={workflow.id} value={workflow.id}>
                {workflow.title}
              </option>
            ))}
          </select>
        </label>
        <button className="button primary" type="button" onClick={runWorkflow} disabled={pending}>
          {pending ? "Running…" : "Start multi-agent run"}
        </button>
        {activeRun?.status === "approval" ? (
          <button className="button" type="button" onClick={approve} disabled={pending}>
            Approve sandbox action
          </button>
        ) : null}
      </div>

      {error ? <p className="demo-error">{error}</p> : null}

      {platform ? (
        <p className="muted-line">
          {platform.name} public target {platform.public_host} · distinct from Agent Fleet (
          {platform.distinct_from})
        </p>
      ) : null}

      {activeRun ? (
        <article className="card demo-run">
          <small>
            {activeRun.status} · {activeRun.mode}
            {activeRun.seeded ? " · seeded demo" : ""} · {activeRun.id.slice(0, 8)}
          </small>
          <h3>{activeRun.workflow_title}</h3>
          <p>{activeRun.goal}</p>
          <div className="demo-steps">
            {activeRun.steps.map((step) => (
              <div key={`${step.agent}-${step.role}`} className="task">
                <strong>{step.agent}</strong> — {step.role}
                <div className="muted-line">{step.summary.slice(0, 220)}</div>
              </div>
            ))}
          </div>
          {activeRun.citations.length ? (
            <div className="demo-citations">
              <small>Citations</small>
              {activeRun.citations.map((cite) => (
                <div key={cite.source_id} className="task">
                  <strong>{cite.title}</strong>
                  <div className="muted-line">{cite.excerpt}</div>
                </div>
              ))}
            </div>
          ) : null}
          {activeRun.artifact ? (
            <pre className="demo-artifact">{activeRun.artifact}</pre>
          ) : null}
          <div className="demo-controls">
            <Link className="button" href="/traces">
              Open traces
            </Link>
            <Link className="button" href="/runs">
              Open runs board
            </Link>
          </div>
        </article>
      ) : (
        <article className="card">
          <small>Ready</small>
          <h3>Start a workflow to exercise orchestration + RAG + MCP + traces</h3>
          <p>
            The API runs a specialist agent DAG, retrieves cited knowledge, calls sandbox MCP
            tools, and records every span for the Traces page. Web search uses SearXNG only
            when that service is configured.
          </p>
        </article>
      )}

      {runs.length ? (
        <div className="grid">
          {runs.slice(0, 4).map((run) => (
            <article className="card" key={run.id}>
              <small>
                {run.status}
                {run.seeded ? " · seeded" : ""} · {run.citations.length} citations
              </small>
              <h3>{run.workflow_title}</h3>
              <p className="muted-line">{run.goal.slice(0, 140)}</p>
              <button className="button" type="button" onClick={() => setActiveRun(run)}>
                Inspect
              </button>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
