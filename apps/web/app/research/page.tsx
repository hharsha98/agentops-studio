import { PageShell } from "@/components/page-shell";
import { StatusBadge } from "@/components/status-badge";

const RESEARCH_PIPELINE = [
  { step: "01", title: "Query planning", detail: "Market, customer, and internal context", duration: "12s", status: "done" },
  { step: "02", title: "SearXNG search", detail: "8 sources ranked by relevance", duration: "48s", status: "done" },
  { step: "03", title: "Firecrawl extraction", detail: "Clean page content and metadata", duration: "1m 06s", status: "running" },
  { step: "04", title: "Citation audit", detail: "Confidence notes and source map", duration: "—", status: "backlog" }
] as const;

export default function ResearchPage() {
  return (
    <PageShell
      description="SearXNG handles private search. Firecrawl extracts clean page content. Agents turn sources into cited business reports."
      eyebrow="Deep web research"
      title="Search, extract, cite, and brief"
    >
      <div className="pipeline-board">
        {RESEARCH_PIPELINE.map((item) => (
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
        {["Search queries", "Extracted pages", "Cited findings", "Confidence notes", "Competitor reports", "Source audit"].map((item) => (
          <article className="card" key={item}>
            <StatusBadge label="Research workspace" status="sandbox" />
            <h3>{item}</h3>
            <p>Designed so teams can review evidence, not just final answers.</p>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
