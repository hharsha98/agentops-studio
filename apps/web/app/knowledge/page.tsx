"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PageShell } from "@/components/page-shell";
import { ErrorBanner, LoadingBlock } from "@/components/ui";
import { api, type KnowledgeChunk, type KnowledgeDocument } from "@/lib/api";

function KnowledgeBrowser() {
  const search = useSearchParams();
  const requested = search.get("doc");
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [chunkCount, setChunkCount] = useState(0);
  const [selected, setSelected] = useState<string | null>(requested);
  const [chunks, setChunks] = useState<KnowledgeChunk[]>([]);
  const [hits, setHits] = useState<KnowledgeChunk[]>([]);
  const [query, setQuery] = useState("refund policy");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const openSeq = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const seq = ++openSeq.current;
    (async () => {
      try {
        const data = await api.knowledge();
        if (cancelled || openSeq.current !== seq) return;
        setDocuments(data.documents);
        setChunkCount(data.chunk_count);
        const initial = requested || data.documents[0]?.id || null;
        setSelected(initial);
        if (initial) {
          const detail = await api.knowledgeDocument(initial);
          if (!cancelled && openSeq.current === seq) setChunks(detail.chunks);
        }
        const queried = await api.queryKnowledge("refund policy", 3);
        if (!cancelled && openSeq.current === seq) setHits(queried.hits);
        if (!cancelled && openSeq.current === seq) setError(null);
      } catch (err) {
        if (!cancelled && openSeq.current === seq) {
          setError(err instanceof Error ? err.message : "Failed to load knowledge");
        }
      } finally {
        if (!cancelled && openSeq.current === seq) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requested]);

  async function openDoc(id: string) {
    const seq = ++openSeq.current;
    const previous = selected;
    setSelected(id);
    setChunks([]);
    setBusy(true);
    try {
      const detail = await api.knowledgeDocument(id);
      if (openSeq.current !== seq) return;
      setChunks(detail.chunks);
      setError(null);
    } catch (err) {
      if (openSeq.current !== seq) return;
      setSelected(previous);
      setError(err instanceof Error ? err.message : "Failed to open document");
      if (previous) {
        try {
          const detail = await api.knowledgeDocument(previous);
          if (openSeq.current === seq) setChunks(detail.chunks);
        } catch {
          if (openSeq.current === seq) setChunks([]);
        }
      }
    } finally {
      if (openSeq.current === seq) setBusy(false);
    }
  }

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const data = await api.queryKnowledge(query, 3);
      setHits(data.hits);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <form className="row form-inline" onSubmit={onSearch}>
        <label className="field grow">
          RAG query
          <input value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <button className="button primary" type="submit" disabled={busy}>
          {busy ? "Retrieving…" : "Retrieve"}
        </button>
      </form>
      <p className="muted">
        {documents.length} documents · {chunkCount} chunks
      </p>
      {error ? <ErrorBanner message={error} /> : null}
      {loading ? <LoadingBlock label="Loading knowledge" /> : null}
      <div className="split">
        <div className="stack">
          {documents.map((doc) => (
            <button
              className={doc.id === selected ? "card card-button active" : "card card-button"}
              key={doc.id}
              type="button"
              onClick={() => openDoc(doc.id)}
            >
              <span className="mono">
                {doc.source_type} · {doc.chunk_count} chunks
              </span>
              <h2>{doc.title}</h2>
              <p>{doc.preview}</p>
            </button>
          ))}
        </div>
        <div className="stack">
          <section className="panel">
            <h2>Chunks</h2>
            {chunks.length === 0 ? <p className="muted">Select a document.</p> : null}
            {chunks.map((chunk) => (
              <article key={chunk.id} className="card">
                <span className="mono">{chunk.id}</span>
                <p>{chunk.text}</p>
              </article>
            ))}
          </section>
          <section className="panel">
            <h2>Query hits</h2>
            {hits.length === 0 ? <p className="muted">No hits for this query.</p> : null}
            {hits.map((hit) => (
              <article key={hit.id} className="card">
                <span className="mono">score {hit.score}</span>
                <h3>{hit.title}</h3>
                <p>{hit.text}</p>
              </article>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function KnowledgePage() {
  return (
    <PageShell
      eyebrow="Knowledge"
      title="Knowledge base"
      description="TF-IDF over the seeded markdown. Open a document or retrieve cited chunks."
    >
      <Suspense fallback={<LoadingBlock label="Loading knowledge" />}>
        <KnowledgeBrowser />
      </Suspense>
    </PageShell>
  );
}
