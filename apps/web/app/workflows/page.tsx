"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { ErrorBanner, LoadingBlock, StatusBadge } from "@/components/ui";
import { api, type Workflow } from "@/lib/api";

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [goal, setGoal] = useState("");
  const [started, setStarted] = useState<{ id: string; title: string; status: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .workflows()
      .then((data) => {
        if (cancelled) return;
        setWorkflows(data.workflows);
        setError(null);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function reload() {
    setLoading(true);
    api
      .workflows()
      .then((data) => {
        setWorkflows(data.workflows);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  async function start(workflowId: string) {
    setBusy(true);
    try {
      const run = await api.createRun(workflowId, goal);
      setStarted({ id: run.id, title: run.workflow_title, status: run.status });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell
      eyebrow="Workflows"
      title="Outcome workflows"
      description="Each card is a specialist DAG. Run starts the workflow and opens the new record."
    >
      <div className="stack">
        <label className="field">
          Goal for the next run
          <textarea
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            rows={3}
            placeholder="Optional. Blank uses the workflow default."
          />
        </label>
        {started ? (
          <div className="banner banner-ok">
            <p>
              Started {started.title} · <StatusBadge status={started.status} />
            </p>
            <Link className="button primary" href={`/runs/${started.id}`}>
              Open run
            </Link>
          </div>
        ) : null}
        {error ? <ErrorBanner message={error} onRetry={reload} /> : null}
        {loading ? <LoadingBlock label="Loading workflows" /> : null}
        {!loading && workflows.length === 0 && !error ? (
          <p className="muted">No workflows are registered.</p>
        ) : null}
        <div className="card-grid">
          {workflows.map((workflow) => (
            <article className="card" key={workflow.id} id={workflow.id}>
              <div className="row">
                {workflow.requires_approval ? <StatusBadge status="approval" /> : <span className="badge">no gate</span>}
                <span className="mono">{workflow.id}</span>
              </div>
              <h2>{workflow.title}</h2>
              <p>{workflow.description}</p>
              <p className="muted">Outcome: {workflow.outcome}</p>
              <ol className="agent-line">
                {workflow.agents.map((agent) => (
                  <li key={agent}>{agent}</li>
                ))}
              </ol>
              <button className="button primary" type="button" onClick={() => void start(workflow.id)} disabled={busy}>
                {busy ? "Running…" : "Run"}
              </button>
            </article>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
