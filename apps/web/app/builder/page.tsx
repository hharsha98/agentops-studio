import { PageShell } from "@/components/page-shell";

export default function BuilderPage() {
  return (
    <PageShell
      eyebrow="Runtime builder"
      title="Configure agents, workflows, tools, and approvals"
      description="Users start from approved templates, then safely edit prompts, tools, models, schemas, RAG sources, and approval gates."
    >
      <div className="grid">
        {["Agent templates", "Workflow templates", "Tool permissions", "Output schemas", "RAG sources", "Approval gates"].map((item) => (
          <article className="card" key={item}>
            <small>Builder module</small>
            <h3>{item}</h3>
            <p>Safe advanced configuration designed for public demos and private real actions.</p>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
