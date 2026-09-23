import { PageShell } from "@/components/page-shell";
import { DemoConsole } from "@/components/demo-console";

export default function DashboardPage() {
  return (
    <PageShell
      eyebrow="Console"
      title="Operations console"
      description="Start a run, approve what is waiting, and open the artifact. Seeded showcase runs stay on templates so the first screen is immediate."
    >
      <DemoConsole />
    </PageShell>
  );
}
