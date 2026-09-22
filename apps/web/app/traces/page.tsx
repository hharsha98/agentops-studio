"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { api, type TraceSpan } from "@/lib/api";

export default function TracesPage() {
  const [spans, setSpans] = useState<TraceSpan[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .traces()
      .then((data) => setSpans(data.spans))
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <PageShell
      eyebrow="Observability"
      title="Trace every prompt, tool call, artifact, and approval"
      description="Internal run spans are always recorded. Optional Langfuse export can be added later — the studio demo does not require it."
    >
      {error ? <p className="demo-error">{error}</p> : null}
      {!error && spans.length === 0 ? (
        <article className="card">
          <small>Empty</small>
          <h3>No spans yet</h3>
          <p>Start a workflow from the Dashboard to populate the trace waterfall.</p>
        </article>
      ) : null}
      <div className="grid">
        {spans.slice(0, 24).map((span) => (
          <article className="card" key={span.id}>
            <small>
              {span.kind} · {span.status} · {span.duration_ms ?? 0}ms
            </small>
            <h3>{span.name}</h3>
            <p className="muted-line">run {span.run_id.slice(0, 8)}</p>
            <pre className="demo-artifact">
              {JSON.stringify(span.output, null, 2).slice(0, 420)}
            </pre>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
