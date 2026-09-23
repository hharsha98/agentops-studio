"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { ErrorBanner, LoadingBlock, StatusBadge } from "@/components/ui";
import { api, type RunRecord } from "@/lib/api";

const LANE_ORDER = ["backlog", "running", "approval", "failed", "done"] as const;

export default function RunsPage() {
  const [lanes, setLanes] = useState<Record<string, RunRecord[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    return api
      .runs()
      .then((data) => {
        setLanes(data.lanes);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .runs()
      .then((data) => {
        if (cancelled) return;
        setLanes(data.lanes);
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
    void refresh();
  }

  async function approve(runId: string) {
    setBusy(true);
    try {
      await api.approveRun(runId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell
      eyebrow="Runs"
      title="Run board"
      description="Open a card for the artifact, citations, and spans. Approve only moves a sandbox Slack post."
    >
      <div className="stack">
        <div className="row">
          <button className="button" type="button" onClick={reload} disabled={busy || loading}>
            Refresh
          </button>
          <Link className="button" href="/workflows">
            Start a workflow
          </Link>
        </div>
        {error ? <ErrorBanner message={error} onRetry={reload} /> : null}
        {loading ? <LoadingBlock label="Loading runs" /> : null}
        <div className="board">
          {LANE_ORDER.map((lane) => {
            const items = lanes[lane] || [];
            return (
              <section className={`lane lane-${lane}`} key={lane} aria-label={lane}>
                <header>
                  <h2>{lane}</h2>
                  <span>{items.length}</span>
                </header>
                {items.length === 0 ? <p className="muted">No runs</p> : null}
                {items.map((run) => (
                  <article className="task" key={run.id}>
                    <StatusBadge status={run.status} />
                    <h3>
                      <Link href={`/runs/${run.id}`}>{run.workflow_title}</Link>
                    </h3>
                    <p>{run.goal}</p>
                    <p className="mono">
                      {run.mode}
                      {run.seeded ? " · seeded" : ""} · {run.citations.length} citations
                    </p>
                    <div className="row">
                      <Link className="button" href={`/runs/${run.id}`}>
                        Open
                      </Link>
                      {run.status === "approval" ? (
                        <button className="button primary" type="button" onClick={() => void approve(run.id)} disabled={busy}>
                          Approve
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </section>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
