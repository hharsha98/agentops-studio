"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { ErrorBanner, LoadingBlock } from "@/components/ui";
import { api, type RunRecord, type TraceSpan } from "@/lib/api";

function TraceBrowser() {
  const search = useSearchParams();
  const paramRun = search.get("run") || "";
  const [picked, setPicked] = useState<string | null>(null);
  const runId = picked ?? paramRun;
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [spans, setSpans] = useState<TraceSpan[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .runs()
      .then((board) => api.traces(runId || undefined).then((traces) => ({ board, traces })))
      .then(({ board, traces }) => {
        if (cancelled) return;
        setRuns(board.runs);
        setSpans(traces.spans);
        setLoadedFor(runId);
        setError(null);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setLoadedFor(runId);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [runId, attempt]);

  function retry() {
    setError(null);
    setLoadedFor(null);
    setAttempt((value) => value + 1);
  }

  const loading = loadedFor !== runId;

  return (
    <div className="stack">
      <div className="row">
        <label className="field">
          Run filter
          <select value={runId} onChange={(event) => setPicked(event.target.value)}>
            <option value="">All runs</option>
            {runs.map((run) => (
              <option key={run.id} value={run.id}>
                {run.workflow_title} · {run.status} · {run.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </label>
        <Link className="button" href="/dashboard">
          Start a run
        </Link>
      </div>
      {error ? <ErrorBanner message={error} onRetry={retry} /> : null}
      {loading ? <LoadingBlock label="Loading traces" /> : null}
      {!loading && spans.length === 0 ? (
        <div className="empty">
          <strong>No spans</strong>
          <p>Start a workflow from the dashboard. Spans are stored on the run.</p>
        </div>
      ) : null}
      <ul className="stack-list">
        {spans.map((span) => {
          const open = openId === span.id;
          return (
            <li key={span.id} className="row-card">
              <button className="span-button" type="button" onClick={() => setOpenId(open ? null : span.id)}>
                <span className={`badge badge-${span.status === "error" ? "failed" : "done"}`}>{span.kind}</span>
                <strong>{span.name}</strong>
                <span className="mono">
                  {span.status} · {span.duration_ms ?? 0}ms
                </span>
              </button>
              <Link href={`/runs/${span.run_id}`}>Open run</Link>
              {open ? <pre>{JSON.stringify({ input: span.input, output: span.output }, null, 2)}</pre> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function TracesPage() {
  return (
    <PageShell
      eyebrow="Traces"
      title="Trace spans"
      description="Orchestrator, agent, tool, RAG, model, and approval spans. Filter to one run."
    >
      <Suspense fallback={<LoadingBlock label="Loading traces" />}>
        <TraceBrowser />
      </Suspense>
    </PageShell>
  );
}
