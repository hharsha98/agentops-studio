import { PageShell } from "@/components/page-shell";
import { StatusBadge } from "@/components/status-badge";
import { getMcpTools } from "@/lib/api";

export default async function McpPage() {
  const catalog = await getMcpTools();

  return (
    <PageShell
      description={`${catalog.total} MCP tools are registered. Status reflects sandbox, approval, or live usage from recent run traces.`}
      eyebrow="MCP registry"
      title="Marketplace-style tools with safe sandbox previews"
    >
      <div className="grid">
        {catalog.tools.map((tool) => (
          <article className="card tool-card" key={tool.id}>
            <StatusBadge label={tool.status} status={tool.status} />
            <h3>{tool.name}</h3>
            <p>{tool.detail}</p>
            {tool.recent_activity ? <small>Active in recent run traces</small> : null}
          </article>
        ))}
      </div>
    </PageShell>
  );
}
