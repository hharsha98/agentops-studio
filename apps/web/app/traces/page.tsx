import { PageShell } from "@/components/page-shell";

export default function TracesPage() {
  return (
    <PageShell
      eyebrow="Observability"
      title="Trace every prompt, tool call, artifact, and approval"
      description="Langfuse is required for deep inspection, while the app also stores internal run history and audit logs."
    >
      <div className="grid">
        {["Prompt trace", "Tool call", "Token estimate", "Citation", "Approval", "Error"].map((item) => (
          <article className="card" key={item}>
            <small>Trace event</small>
            <h3>{item}</h3>
            <p>Operational evidence for how the agent system worked, what changed, and how failures were debugged.</p>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
