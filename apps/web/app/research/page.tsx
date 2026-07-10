import { PageShell } from "@/components/page-shell";
import { StatusBadge } from "@/components/status-badge";
import { getResearchOverview } from "@/lib/api";

export default async function ResearchPage() {
  const overview = await getResearchOverview();

  return (
    <PageShell
      description={`${overview.runs_total} research runs and ${overview.documents_total} indexed research documents are available from the API.`}
      eyebrow="Deep web research"
      title="Search, extract, cite, and brief"
    >
      <div className="pipeline-board">
        {overview.pipeline.map((item) => (
          <article className={`pipeline-step ${item.status}`} key={item.step}>
            <span className="pipeline-step-index">{item.step}</span>
            <div className="pipeline-step-meta">
              <strong>{item.title}</strong>
              <small>{item.detail}</small>
            </div>
            <span className="pipeline-step-time">{item.duration}</span>
          </article>
        ))}
      </div>

      <div className="grid" style={{ marginTop: 24 }}>
        {overview.workspace_cards.map((item) => (
          <article className="card" key={item}>
            <StatusBadge label="Research workspace" status="sandbox" />
            <h3>{item}</h3>
            <p>
              {overview.active_run_id
                ? `Linked to live run ${overview.active_run_id}.`
                : "Designed so teams can review evidence, not just final answers."}
            </p>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
