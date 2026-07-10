import { PageShell } from "@/components/page-shell";

const TRACE_WATERFALL = [
  { label: "Prompt trace", width: "88%", duration: "420ms" },
  { label: "Tool call", width: "64%", duration: "1.8s" },
  { label: "Token estimate", width: "42%", duration: "18.4k" },
  { label: "Citation", width: "56%", duration: "6 sources" },
  { label: "Approval", width: "72%", duration: "Slack gate" },
  { label: "Error", width: "18%", duration: "0 retries" }
];

export default function TracesPage() {
  return (
    <PageShell
      description="Langfuse is required for deep inspection, while the app also stores internal run history and audit logs."
      eyebrow="Observability"
      title="Trace every prompt, tool call, artifact, and approval"
    >
      <section className="diagram">
        <h2>Langfuse waterfall preview</h2>
        <div className="waterfall">
          {TRACE_WATERFALL.map((row) => (
            <div className="waterfall-row" key={row.label}>
              <span className="waterfall-label">{row.label}</span>
              <div className="waterfall-bar-wrap">
                <div className="waterfall-bar" style={{ width: row.width }} />
              </div>
              <span className="waterfall-duration">{row.duration}</span>
            </div>
          ))}
        </div>
      </section>

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
