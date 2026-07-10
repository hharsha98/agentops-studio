import { PageShell } from "@/components/page-shell";
import { getBenchmarks } from "@/lib/api";

export default async function BenchmarksPage() {
  const report = await getBenchmarks();

  return (
    <PageShell
      eyebrow="Benchmark scorecard"
      title="Measure reliability, quality, speed, safety, and cost"
      description={`The benchmark suite scores ${report.runs_evaluated} replay runs against ${report.scenario_count} synthetic workflow scenarios with deterministic checks.`}
    >
      <div className="metrics">
        {[
          ["Scenarios", String(report.scenario_count)],
          ["Runs scored", String(report.runs_evaluated)],
          ["Average score", `${report.average_overall_score}%`],
          ["Categories", String(report.categories.length)]
        ].map(([label, value]) => (
          <div className="metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <section className="diagram">
        <h2>Evaluation categories</h2>
        <div className="grid">
          {report.categories.map((category) => (
            <article className="card" key={category.id}>
              <small>{category.average_score}% average</small>
              <h3>{category.label}</h3>
              <p>{category.description}</p>
              <div className="score-bar-wrap">
                <div className="score-bar" style={{ width: `${category.average_score}%` }} />
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="diagram">
        <h2>Recent run scores</h2>
        <div className="trace-grid">
          {report.run_scores.slice(0, 5).map((score) => (
            <article className="trace-row" key={score.run_id}>
              <span>{score.overall_score}% · {score.status}</span>
              <strong>{score.title}</strong>
              <small>{score.notes.join(" · ")}</small>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
