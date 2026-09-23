"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { ErrorBanner, LoadingBlock, StatusBadge } from "@/components/ui";
import { api, type RunRecord } from "@/lib/api";

export default function BenchmarksPage() {
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .runs()
      .then((data) => {
        if (cancelled) return;
        setRuns(data.runs);
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
      .runs()
      .then((data) => {
        setRuns(data.runs);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  const scored = runs.filter((run) => run.steps.some((step) => step.agent === "workflow-evaluator"));

  return (
    <PageShell
      eyebrow="Scorecards"
      title="Run scorecards"
      description="Product research includes an evaluator step. This page reads those steps from stored runs. There is no separate benchmark farm."
    >
      <div className="stack">
        <div className="row">
          <Link className="button primary" href="/workflows">
            Run product research
          </Link>
          <button className="button" type="button" onClick={reload}>
            Refresh
          </button>
        </div>
        {error ? <ErrorBanner message={error} onRetry={reload} /> : null}
        {loading ? <LoadingBlock label="Loading scorecards" /> : null}
        {!loading && scored.length === 0 ? (
          <div className="empty">
            <strong>No evaluator steps yet</strong>
            <p>Start the product research workflow. Its last agent writes the scorecard.</p>
          </div>
        ) : null}
        <div className="card-grid">
          {scored.map((run) => {
            const step = run.steps.find((item) => item.agent === "workflow-evaluator");
            return (
              <article className="card" key={run.id}>
                <div className="row">
                  <StatusBadge status={run.status} />
                  <span className="mono">{run.mode}</span>
                </div>
                <h2>{run.workflow_title}</h2>
                <p>{step?.summary}</p>
                <Link href={`/runs/${run.id}`}>Open run</Link>
              </article>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
