import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export default function ResearchPage() {
  return (
    <PageShell
      eyebrow="Deep web research"
      title="Web search is a sandbox tool, not a crawler farm."
      description="Firecrawl is not running in this demo. Deep Research calls web_search. SearXNG is optional; without it the tool returns a deterministic fallback and the run still completes."
    >
      <div className="grid">
        <article className="card">
          <small>Live</small>
          <h3>Try web_search</h3>
          <p>The MCP page invokes the same tool the research agent uses.</p>
          <Link className="button primary" href="/mcp">Open MCP</Link>
        </article>
        <article className="card">
          <small>Live</small>
          <h3>Cited product memo</h3>
          <p>Product research combines that fallback with RAG citations and does not wait for approval.</p>
          <Link className="button" href="/workflows">Open workflows</Link>
        </article>
      </div>
    </PageShell>
  );
}
