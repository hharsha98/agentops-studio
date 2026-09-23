"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { ErrorBanner, LoadingBlock, StatusBadge } from "@/components/ui";
import { api, type Workflow } from "@/lib/api";

export default function BuilderPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [workflowId, setWorkflowId] = useState("executive-daily-brief");
  const [goal, setGoal] = useState("");
  const [runId, setRunId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .workflows()
      .then((data) => {
        setWorkflows(data.workflows);
        if (data.workflows[0]) setWorkflowId(data.workflows[0].id);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function start() {
    setBusy(true);
    try {
      const run = await api.createRun(workflowId, goal);
      setRunId(run.id);
      setStatus(run.status);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start");
    } finally {
      setBusy(false);
    }
  }

  const selected = workflows.find((workflow) => workflow.id === workflowId);

  return (
    <PageShell
      eyebrow="Builder"
      title="Compose a run"
      description="Choose a workflow, write the operator goal, and start it. The DAG itself stays code-defined."
    >
      <div className="stack">
        {error ? <ErrorBanner message={error} /> : null}
        {loading ? <LoadingBlock label="Loading workflows" /> : null}
        <section className="panel">
          <label className="field">
            Workflow
            <select value={workflowId} onChange={(event) => setWorkflowId(event.target.value)}>
              {workflows.map((workflow) => (
                <option key={workflow.id} value={workflow.id}>
                  {workflow.title}
                </option>
              ))}
            </select>
          </label>
          {selected ? (
            <p className="muted">
              {selected.agents.join(" → ")} · {selected.outcome}
            </p>
          ) : null}
          <label className="field">
            Goal
            <textarea
              value={goal}
              rows={5}
              onChange={(event) => setGoal(event.target.value)}
              placeholder="What should this run produce?"
            />
          </label>
          <button className="button primary" type="button" onClick={() => void start()} disabled={busy || !workflowId}>
            {busy ? "Running…" : "Start multi-agent run"}
          </button>
        </section>
        {runId && status ? (
          <div className="banner banner-ok">
            <p>
              Run created · <StatusBadge status={status} />
            </p>
            <Link className="button primary" href={`/runs/${runId}`}>
              Open run
            </Link>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
