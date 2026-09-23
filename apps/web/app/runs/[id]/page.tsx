"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { ErrorBanner, LoadingBlock, StatusBadge, formatWhen } from "@/components/ui";
import { api, type RunRecord, type TraceSpan } from "@/lib/api";

export default function RunDetailPage() {
  const params = useParams<{ id: string }>();
  const runId = params.id;
  const [run, setRun] = useState<RunRecord | null>(null);
  const [spans, setSpans] = useState<TraceSpan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getRun(runId)
      .then((data) => {
        if (cancelled) return;
        setRun(data.run);
        setSpans(data.spans);
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
  }, [runId]);

  function reload() {
    setLoading(true);
    api
      .getRun(runId)
      .then((data) => {
        setRun(data.run);
        setSpans(data.spans);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  async function approve() {
    setBusy(true);
    try {
      const updated = await api.approveRun(runId);
      setRun(updated);
      const detail = await api.getRun(runId);
      setSpans(detail.spans);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell eyebrow="Run" title={run?.workflow_title || "Run detail"} description={run?.goal}>
      <div className="stack">
        <div className="row">
          <Link className="button" href="/runs">
            Back to board
          </Link>
          <Link className="button" href={`/traces?run=${runId}`}>
            Traces
          </Link>
          {run?.status === "approval" ? (
            <button className="button primary" type="button" onClick={() => void approve()} disabled={busy}>
              {busy ? "Approving…" : "Approve sandbox action"}
            </button>
          ) : null}
        </div>
        {error ? <ErrorBanner message={error} onRetry={reload} /> : null}
        {loading ? <LoadingBlock label="Loading run" /> : null}
        {run ? (
          <>
            <section className="panel">
              <div className="row">
                <StatusBadge status={run.status} />
                <span className="mono">{run.mode}</span>
                {run.seeded ? <span className="mono">seeded</span> : null}
                <span className="muted">Updated {formatWhen(run.updated_at)}</span>
              </div>
              <p className="mono">{run.id}</p>
              {run.error ? <p className="banner banner-error">{run.error}</p> : null}
            </section>
            <section className="panel">
              <h2>Steps</h2>
              <ol className="steps">
                {run.steps.map((step) => (
                  <li key={`${run.id}-${step.agent}`}>
                    <strong>{step.agent}</strong>
                    <span>{step.role}</span>
                    {step.tool_calls.length ? <span className="mono">{step.tool_calls.join(", ")}</span> : null}
                    <p>{step.summary}</p>
                  </li>
                ))}
              </ol>
            </section>
            <section className="panel">
              <h2>Citations</h2>
              {run.citations.length === 0 ? <p className="muted">No citations on this run.</p> : null}
              <div className="card-grid">
                {run.citations.map((cite) => (
                  <article className="card" key={cite.source_id}>
                    <span className="mono">score {cite.score}</span>
                    <h3>{cite.title}</h3>
                    <p>{cite.excerpt}</p>
                    <Link href={`/knowledge?doc=${cite.source_id}`}>Open source</Link>
                  </article>
                ))}
              </div>
            </section>
            <section className="panel">
              <h2>Artifact</h2>
              {run.artifact ? <pre>{run.artifact}</pre> : <p className="muted">No artifact.</p>}
            </section>
            <section className="panel">
              <h2>Spans</h2>
              {spans.length === 0 ? <p className="muted">No spans recorded.</p> : null}
              <ul className="stack-list">
                {spans.map((span) => (
                  <li key={span.id} className="row-card">
                    <div>
                      <strong>{span.name}</strong>
                      <p className="mono">
                        {span.kind} · {span.status} · {span.duration_ms ?? 0}ms
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : null}
      </div>
    </PageShell>
  );
}
