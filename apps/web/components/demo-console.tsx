"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type HealthStatus, type RunRecord, type Workflow } from "@/lib/api";
import { ErrorBanner, GatewayBanner, LoadingBlock, StatusBadge, formatWhen } from "@/components/ui";

export function DemoConsole() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [selected, setSelected] = useState("executive-daily-brief");
  const [goal, setGoal] = useState("");
  const [activeRun, setActiveRun] = useState<RunRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function refresh(prefer?: RunRecord) {
    const [nextHealth, catalog, board] = await Promise.all([
      api.health(),
      api.workflows(),
      api.runs()
    ]);
    setHealth(nextHealth);
    setWorkflows(catalog.workflows);
    setRuns(board.runs);
    setActiveRun((current) => {
      const id = prefer?.id || current?.id;
      if (id) {
        return board.runs.find((run) => run.id === id) ?? prefer ?? current;
      }
      return board.runs.find((run) => run.status === "approval") ?? board.runs[0] ?? null;
    });
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [nextHealth, catalog, board] = await Promise.all([
          api.health(),
          api.workflows(),
          api.runs()
        ]);
        if (cancelled) return;
        setHealth(nextHealth);
        setWorkflows(catalog.workflows);
        setRuns(board.runs);
        setActiveRun(board.runs.find((run) => run.status === "approval") ?? board.runs[0] ?? null);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load the console");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function reload() {
    setError(null);
    setLoading(true);
    try {
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load the console");
    } finally {
      setLoading(false);
    }
  }

  async function runWorkflow() {
    setError(null);
    setBusy(true);
    try {
      const run = await api.createRun(selected, goal);
      setActiveRun(run);
      try {
        await refresh(run);
      } catch (err) {
        setError(
          `Run started, but the board did not refresh. ${err instanceof Error ? err.message : "Refresh failed"}`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Run failed");
    } finally {
      setBusy(false);
    }
  }

  async function approve(runId: string) {
    setError(null);
    setBusy(true);
    try {
      const run = await api.approveRun(runId);
      setActiveRun(run);
      try {
        await refresh(run);
      } catch (err) {
        setError(
          `Approved, but the board did not refresh. ${err instanceof Error ? err.message : "Refresh failed"}`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setBusy(false);
    }
  }

  const waiting = runs.filter((run) => run.status === "approval");

  return (
    <div className="stack">
      {health ? (
        <GatewayBanner llm={health.llm} persistence={health.persistence} />
      ) : loading ? (
        <GatewayBanner llm={null} />
      ) : null}
      {error ? <ErrorBanner message={error} onRetry={() => void reload()} /> : null}
      {loading ? <LoadingBlock label="Loading operations console" /> : null}

      <section className="metrics" aria-label="Studio totals">
        <div className="metric">
          <span>Workflows</span>
          <strong>{workflows.length || "—"}</strong>
        </div>
        <div className="metric">
          <span>Knowledge</span>
          <strong>{health?.knowledge_documents ?? "—"}</strong>
        </div>
        <div className="metric">
          <span>MCP tools</span>
          <strong>{health?.mcp_tools ?? "—"}</strong>
        </div>
        <div className="metric">
          <span>Runs</span>
          <strong>{health?.runs ?? runs.length}</strong>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Start multi-agent run</h2>
          <p>Specialists retrieve knowledge, call sandbox tools, and pause when the workflow needs approval.</p>
        </div>
        <div className="form-grid">
          <label>
            Workflow
            <select value={selected} onChange={(event) => setSelected(event.target.value)} disabled={busy}>
              {workflows.map((workflow) => (
                <option key={workflow.id} value={workflow.id}>
                  {workflow.title}
                  {workflow.requires_approval ? " · approval" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="span-2">
            Goal
            <textarea
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              placeholder="Leave blank to use the workflow default goal."
              rows={3}
            />
          </label>
        </div>
        <div className="row">
          <button className="button primary" type="button" onClick={() => void runWorkflow()} disabled={busy || !selected}>
            {busy ? "Running…" : "Start multi-agent run"}
          </button>
          <Link className="button" href="/workflows">
            Browse workflows
          </Link>
        </div>
      </section>

      <div className="split">
        <section className="panel">
          <div className="panel-head">
            <h2>Approval queue</h2>
            <p>{waiting.length ? `${waiting.length} waiting` : "Nothing is waiting on a human."}</p>
          </div>
          {waiting.length === 0 ? (
            <p className="muted">Start an executive brief or support triage to land a run here.</p>
          ) : (
            <ul className="stack-list">
              {waiting.map((run) => (
                <li key={run.id} className="row-card">
                  <div>
                    <StatusBadge status={run.status} />
                    <strong>{run.workflow_title}</strong>
                    <p>{run.goal}</p>
                  </div>
                  <div className="row">
                    <button className="button primary" type="button" onClick={() => void approve(run.id)} disabled={busy}>
                      Approve
                    </button>
                    <Link className="button" href={`/runs/${run.id}`}>
                      Open
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Selected run</h2>
          </div>
          {activeRun ? (
            <article className="stack">
              <div className="row">
                <StatusBadge status={activeRun.status} />
                <span className="mono">{activeRun.mode}</span>
                {activeRun.seeded ? <span className="mono">seeded</span> : null}
                <span className="muted">{formatWhen(activeRun.updated_at)}</span>
              </div>
              <h3>{activeRun.workflow_title}</h3>
              <p>{activeRun.goal}</p>
              <ol className="steps">
                {activeRun.steps.map((step) => (
                  <li key={`${activeRun.id}-${step.agent}`}>
                    <strong>{step.agent}</strong>
                    <span>{step.role}</span>
                    <p>{step.summary}</p>
                  </li>
                ))}
              </ol>
              {activeRun.citations.length ? (
                <p className="muted">{activeRun.citations.length} citations attached.</p>
              ) : null}
              <div className="row">
                {activeRun.status === "approval" ? (
                  <button className="button primary" type="button" onClick={() => void approve(activeRun.id)} disabled={busy}>
                    Approve sandbox action
                  </button>
                ) : null}
                <Link className="button" href={`/runs/${activeRun.id}`}>
                  Open run
                </Link>
                <Link className="button" href={`/traces?run=${activeRun.id}`}>
                  Traces
                </Link>
              </div>
            </article>
          ) : (
            <p className="muted">No runs yet. Start one above.</p>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Recent runs</h2>
          <Link href="/runs">Open the board</Link>
        </div>
        {runs.length === 0 ? (
          <p className="muted">The board is empty.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Workflow</th>
                  <th>Mode</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {runs.slice(0, 8).map((run) => (
                  <tr key={run.id}>
                    <td>
                      <StatusBadge status={run.status} />
                    </td>
                    <td>{run.workflow_title}</td>
                    <td className="mono">{run.mode}</td>
                    <td>{formatWhen(run.updated_at)}</td>
                    <td>
                      <Link href={`/runs/${run.id}`}>Inspect</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
