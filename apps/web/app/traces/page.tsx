import { PageShell } from "@/components/page-shell";
import { getTraceSummary } from "@/lib/api";

export default async function TracesPage() {
  const summary = await getTraceSummary();

  return (
    <PageShell
      description={`${summary.events_total} trace events across ${summary.runs_total} runs. ${summary.llm_events} LLM completions and ${summary.total_tokens.toLocaleString()} tokens recorded.`}
      eyebrow="Observability"
      title="Trace every prompt, tool call, artifact, and approval"
    >
      <section className="diagram">
        <h2>Langfuse waterfall preview</h2>
        <div className="waterfall">
          {summary.waterfall.map((row) => (
            <div className="waterfall-row" key={row.label}>
              <span className="waterfall-label">{row.label}</span>
              <div className="waterfall-bar-wrap">
                <div className="waterfall-bar" style={{ width: `${row.width_percent}%` }} />
              </div>
              <span className="waterfall-duration">{row.duration}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid">
        {summary.recent_events.map((event) => (
          <article className="card" key={event.id}>
            <small>{event.run_title} · {event.agent}</small>
            <h3>{event.title}</h3>
            <p>{event.detail}</p>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
