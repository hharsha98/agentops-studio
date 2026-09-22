"use client";

import { useEffect, useState, useTransition } from "react";
import { PageShell } from "@/components/page-shell";
import { api, type RunRecord } from "@/lib/api";

const LANE_ORDER = ["backlog", "running", "approval", "failed", "done"] as const;

export default function RunsPage() {
  const [lanes, setLanes] = useState<Record<string, RunRecord[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function refresh() {
    startTransition(async () => {
      try {
        const data = await api.runs();
        setLanes(data.lanes);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load runs");
      }
    });
  }

  useEffect(() => {
    refresh();
  }, []);

  function approve(runId: string) {
    startTransition(async () => {
      try {
        await api.approveRun(runId);
        const data = await api.runs();
        setLanes(data.lanes);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Approve failed");
      }
    });
  }

  return (
    <PageShell
      eyebrow="Kanban execution"
      title="Track every agent run from idea to outcome"
      description="Runs move through backlog, running, approval, failed, and done states with replayable artifacts and traces."
    >
      <div className="demo-controls">
        <button className="button" type="button" onClick={refresh} disabled={pending}>
          Refresh
        </button>
      </div>
      {error ? <p className="demo-error">{error}</p> : null}
      <div className="preview-body">
        {LANE_ORDER.map((lane) => (
          <div className="lane" key={lane}>
            <div className="lane-title">
              <span>{lane}</span>
              <span>{(lanes[lane] || []).length}</span>
            </div>
            {(lanes[lane] || []).length === 0 ? (
              <div className="task muted-line">No runs</div>
            ) : (
              (lanes[lane] || []).map((run) => (
                <div className="task" key={run.id}>
                  <strong>{run.workflow_title}</strong>
                  <div className="muted-line">{run.goal.slice(0, 120)}</div>
                  {run.status === "approval" ? (
                    <button
                      className="button"
                      type="button"
                      style={{ marginTop: 8 }}
                      onClick={() => approve(run.id)}
                      disabled={pending}
                    >
                      Approve
                    </button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </PageShell>
  );
}
