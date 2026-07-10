import { PageShell } from "@/components/page-shell";

export default function KnowledgePage() {
  return (
    <PageShell
      eyebrow="Document intelligence"
      title="Company knowledge with required citations"
      description="Upload PDF, Markdown, and DOCX documents. Agents retrieve chunks, cite sources, and attach evidence to workflow outputs."
    >
      <div className="grid">
        {["PDF policies", "Markdown runbooks", "DOCX playbooks"].map((item) => (
          <article className="card" key={item}>
            <small>Knowledge source</small>
            <h3>{item}</h3>
            <p>Chunked, embedded locally, indexed in pgvector, and cited in every research or policy-based output.</p>
          </article>
        ))}
      </div>
    </PageShell>
  );
}

