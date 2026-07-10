import { PageShell } from "@/components/page-shell";

export default function ResearchPage() {
  return (
    <PageShell
      eyebrow="Deep web research"
      title="Search, extract, cite, and brief"
      description="SearXNG handles private search. Firecrawl extracts clean page content. Agents turn sources into cited business reports."
    >
      <div className="grid">
        {["Search queries", "Extracted pages", "Cited findings", "Confidence notes", "Competitor reports", "Source audit"].map((item) => (
          <article className="card" key={item}>
            <small>Research workspace</small>
            <h3>{item}</h3>
            <p>Designed so teams can review evidence, not just final answers.</p>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
