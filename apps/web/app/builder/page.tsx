import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export default function BuilderPage() {
  return (
    <PageShell
      eyebrow="Runtime builder"
      title="A visual builder is not part of this demo."
      description="Workflows, tools, and approval gates are code-defined and already runnable. This route stays up so the link is not a dead end."
    >
      <div className="grid">
        <article className="card">
          <small>Live</small>
          <h3>Workflows</h3>
          <p>Start any of the four specialist DAGs and follow the run on the board.</p>
          <Link className="button primary" href="/workflows">Open workflows</Link>
        </article>
        <article className="card">
          <small>Live</small>
          <h3>MCP sandbox</h3>
          <p>Invoke knowledge search, web search, and sandbox Slack, Gmail, and GitHub handlers.</p>
          <Link className="button" href="/mcp">Open MCP</Link>
        </article>
        <article className="card">
          <small>Live</small>
          <h3>Knowledge</h3>
          <p>Seeded markdown is indexed at startup. Queries return cited chunks.</p>
          <Link className="button" href="/knowledge">Open knowledge</Link>
        </article>
      </div>
    </PageShell>
  );
}
