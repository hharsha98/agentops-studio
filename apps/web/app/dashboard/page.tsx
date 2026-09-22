import { PageShell } from "@/components/page-shell";
import { DemoConsole } from "@/components/demo-console";

export default function DashboardPage() {
  return (
    <PageShell
      eyebrow="Live studio demo"
      title="Operations command center"
      description="A seeded executive brief is already waiting for approval, with citations and traces. Start another workflow to run orchestration, RAG, MCP tools, and the sandbox approval gate again."
    >
      <DemoConsole />
    </PageShell>
  );
}
