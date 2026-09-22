"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { PageShell } from "@/components/page-shell";
import { api, type KnowledgeDocument } from "@/lib/api";

export default function KnowledgePage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [chunkCount, setChunkCount] = useState(0);
  const [hits, setHits] = useState<
    Array<{ id: string; title: string; text: string; score: number }>
  >([]);
  const [query, setQuery] = useState("refund policy");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    api
      .knowledge()
      .then((data) => {
        setDocuments(data.documents);
        setChunkCount(data.chunk_count);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const data = await api.queryKnowledge(query, 3);
        setHits(data.hits);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Query failed");
      }
    });
  }

  return (
    <PageShell
      eyebrow="Document intelligence"
      title="Company knowledge with required citations"
      description={`${documents.length} seeded documents · ${chunkCount} chunks. Agents retrieve excerpts and attach citations to workflow outputs.`}
    >
      <form className="demo-controls" onSubmit={onSearch}>
        <label>
          <span className="eyebrow">RAG query</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <button className="button primary" type="submit" disabled={pending}>
          Retrieve
        </button>
      </form>
      {error ? <p className="demo-error">{error}</p> : null}
      <div className="grid">
        {documents.map((doc) => (
          <article className="card" key={doc.id}>
            <small>
              {doc.source_type} · {doc.chunk_count} chunks
            </small>
            <h3>{doc.title}</h3>
            <p>{doc.preview}</p>
          </article>
        ))}
      </div>
      {hits.length ? (
        <div className="grid" style={{ marginTop: 24 }}>
          {hits.map((hit) => (
            <article className="card" key={hit.id}>
              <small>score {hit.score}</small>
              <h3>{hit.title}</h3>
              <p>{hit.text}</p>
            </article>
          ))}
        </div>
      ) : null}
    </PageShell>
  );
}
