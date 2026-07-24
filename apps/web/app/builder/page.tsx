import { PageShell } from "@/components/page-shell";
import { builderCapabilities } from "@/lib/platform-data";

export default function BuilderPage() {
  return (
    <PageShell
      description="Users start from approved templates, then safely edit prompts, tools, models, schemas, RAG sources, and approval gates."
      eyebrow="Runtime builder"
      title="Configure agents, workflows, tools, and approvals"
    >
      <div className="builder-grid">
        {builderCapabilities.map((capability) => (
          <article className="builder-card" key={capability.title}>
            <small>Builder module</small>
            <h3>{capability.title}</h3>
            <p>{capability.text}</p>
          </article>
        ))}
      </div>

      <section className="diagram">
        <h2>Safe configuration layers</h2>
        <div className="grid">
          {["Agent templates", "Workflow templates", "Tool permissions", "Output schemas", "RAG sources", "Approval gates"].map((item) => (
            <article className="card" key={item}>
              <small>Editable surface</small>
              <h3>{item}</h3>
              <p>Safe advanced configuration designed for public demos and private real actions.</p>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
