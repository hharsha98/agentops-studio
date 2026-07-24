import { PageShell } from "@/components/page-shell";
import { getKnowledgeDocuments, searchKnowledge } from "@/lib/api";

export default async function KnowledgePage() {
  const [documentsResponse, searchResponse] = await Promise.all([
    getKnowledgeDocuments(),
    searchKnowledge("support approval customer message")
  ]);

  return (
    <PageShell
      eyebrow="Document intelligence"
      title="Company knowledge with required citations"
      description={`${documentsResponse.total} indexed sources are available for workflow retrieval. Agents retrieve chunks, cite sources, and attach evidence to workflow outputs.`}
    >
      <div className="grid">
        {documentsResponse.documents.map((document) => (
          <article className="card" key={document.id}>
            <small>{document.source_type.toUpperCase()} · {document.owner}</small>
            <h3>{document.title}</h3>
            <p>{document.chunks_total} chunks available for retrieval with citations attached to workflow artifacts.</p>
            <div className="score-bar-wrap">
              <div className="score-bar" style={{ width: `${Math.min(document.chunks_total * 8, 100)}%` }} />
            </div>
            <div className="card-meta">
              {document.tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}
            </div>
          </article>
        ))}
      </div>
      <section className="diagram">
        <h2>Retrieval preview</h2>
        <div className="trace-grid">
          {searchResponse.results.map((result) => (
            <article className="trace-row" key={result.chunk_id}>
              <span>score {result.score}</span>
              <strong>{result.citation}</strong>
              <small>{result.content}</small>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
