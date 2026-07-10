import { PageShell } from "@/components/page-shell";

const metrics = [
  ["Agents", "30"],
  ["Workflows", "10"],
  ["Replay runs", "12"],
  ["Deploy paths", "4"]
];

export default function DashboardPage() {
  return (
    <PageShell
      eyebrow="Public replay demo"
      title="Operations command center"
      description="Monitor agent squads, workflow outcomes, replay runs, cost visibility, and deployment readiness from one workspace."
    >
      <div className="metrics">
        {metrics.map(([label, value]) => (
          <div className="metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="grid">
        <article className="card">
          <small>Running</small>
          <h3>Executive daily brief</h3>
          <p>Agents summarize support, revenue, product, and hiring activity, then wait for Slack approval.</p>
        </article>
        <article className="card">
          <small>Approval</small>
          <h3>Gmail investor draft</h3>
          <p>Draft-only mode keeps external communication gated behind explicit approval.</p>
        </article>
        <article className="card">
          <small>Trace</small>
          <h3>Langfuse-ready run</h3>
          <p>Every step stores prompt, model, tool, artifact, citation, token estimate, and approval state.</p>
        </article>
      </div>
    </PageShell>
  );
}
