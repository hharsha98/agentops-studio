import { PageShell } from "@/components/page-shell";
import { StatusBadge } from "@/components/status-badge";

const MCP_TOOLS = [
  { name: "GitHub", status: "sandbox" as const, detail: "PR review and branch automation after approval" },
  { name: "Gmail", status: "sandbox" as const, detail: "Draft-only customer and investor emails" },
  { name: "Slack", status: "approval" as const, detail: "Leadership brief posts after human gate" },
  { name: "SearXNG", status: "live" as const, detail: "Private web search for research agents" },
  { name: "Firecrawl", status: "live" as const, detail: "Full-page extraction with citations" },
  { name: "Postgres", status: "sandbox" as const, detail: "Read-only operational queries" },
  { name: "S3", status: "sandbox" as const, detail: "Artifact storage and export" },
  { name: "Langfuse", status: "live" as const, detail: "Trace waterfall and token analytics" },
  { name: "Kubernetes", status: "sandbox" as const, detail: "Deployment status and rollout checks" }
];

export default function McpPage() {
  return (
    <PageShell
      description="Public users can explore install simulations. Private admins can enable approved templates with permissions, schemas, tests, and audit logs."
      eyebrow="MCP registry"
      title="Marketplace-style tools with safe sandbox previews"
    >
      <div className="grid">
        {MCP_TOOLS.map((tool) => (
          <article className="card tool-card" key={tool.name}>
            <StatusBadge label={tool.status} status={tool.status} />
            <h3>{tool.name}</h3>
            <p>{tool.detail}</p>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
