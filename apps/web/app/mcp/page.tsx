import { PageShell } from "@/components/page-shell";

export default function McpPage() {
  return (
    <PageShell
      eyebrow="MCP registry"
      title="Marketplace-style tools with safe sandbox previews"
      description="Public users can explore install simulations. Private admins can enable approved templates with permissions, schemas, tests, and audit logs."
    >
      <div className="grid">
        {["GitHub", "Gmail", "Slack", "SearXNG", "Firecrawl", "Postgres", "S3", "Langfuse", "Kubernetes"].map((tool) => (
          <article className="card" key={tool}>
            <small>Approved template</small>
            <h3>{tool}</h3>
            <p>Sandbox preview is public-safe. Real tool execution requires private credentials and approval gates.</p>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
