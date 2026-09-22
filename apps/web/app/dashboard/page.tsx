import { PageShell } from "@/components/page-shell";
import { DemoConsole } from "@/components/demo-console";

export default function DashboardPage() {
  return (
    <PageShell
      eyebrow="Live studio demo"
      title="Operations command center"
      description="Start a multi-agent workflow against the local API. Runs exercise orchestration, RAG citations, MCP tools, and approval-gated sandbox actions."
    >
      <DemoConsole />
    </PageShell>
  );
}
