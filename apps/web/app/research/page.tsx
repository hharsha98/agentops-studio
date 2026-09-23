"use client";

import { useState, type FormEvent } from "react";
import { PageShell } from "@/components/page-shell";
import { ErrorBanner } from "@/components/ui";
import { api } from "@/lib/api";

type Hit = { title?: string; url?: string; snippet?: string };

export default function ResearchPage() {
  const [query, setQuery] = useState("multi-agent operations platform");
  const [source, setSource] = useState<string>("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const data = await api.invokeTool("web_search", { query, limit: 5 });
      if (!data.ok) {
        throw new Error(data.error || "web_search failed");
      }
      const result = (data.result ?? {}) as { source?: string; results?: Hit[] };
      setSource(result.source || "unknown");
      setHits(result.results || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell
      eyebrow="Research"
      title="Web research"
      description="This calls the web_search MCP tool. SearXNG is used when it is reachable; otherwise the tool returns the offline fallback."
    >
      <div className="stack">
        <form className="row form-inline" onSubmit={onSubmit}>
          <label className="field grow">
            Query
            <input value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <button className="button primary" type="submit" disabled={busy || !query.trim()}>
            {busy ? "Searching…" : "Search"}
          </button>
        </form>
        {source ? <p className="mono">source {source}</p> : null}
        {error ? <ErrorBanner message={error} /> : null}
        {hits.length === 0 ? <p className="muted">Run a search to see results.</p> : null}
        <div className="card-grid">
          {hits.map((hit) => (
            <article className="card" key={`${hit.url}-${hit.title}`}>
              <h2>{hit.title || "Untitled"}</h2>
              <p>{hit.snippet}</p>
              {hit.url ? (
                <a href={hit.url} target="_blank" rel="noreferrer">
                  {hit.url}
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
