"use client";

import { useEffect, useState, useTransition } from "react";
import { PageShell } from "@/components/page-shell";
import { api, type Workflow } from "@/lib/api";

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    api
      .workflows()
      .then((data) => setWorkflows(data.workflows))
      .catch((err: Error) => setError(err.message));
  }, []);

  function start(workflowId: string) {
    startTransition(async () => {
      try {
        const run = await api.createRun(workflowId);
        setMessage(`Started ${run.workflow_title} → ${run.status} (${run.id.slice(0, 8)})`);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start");
      }
    });
  }

  return (
    <PageShell
      eyebrow="Business workflows"
      title="Outcome-oriented multi-agent runs"
      description="Each workflow is a specialist agent DAG. Start one here, then inspect Runs and Traces."
    >
      {message ? <p className="task">{message}</p> : null}
      {error ? <p className="demo-error">{error}</p> : null}
      <div className="grid">
        {workflows.map((workflow) => (
          <article className="card" key={workflow.id}>
            <small>{workflow.agents.join(" → ")}</small>
            <h3>{workflow.title}</h3>
            <p>{workflow.description}</p>
            <p className="muted-line">Outcome: {workflow.outcome}</p>
            <button
              className="button primary"
              type="button"
              onClick={() => start(workflow.id)}
              disabled={pending}
            >
              Run
            </button>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
