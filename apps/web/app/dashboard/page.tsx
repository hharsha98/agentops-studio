import { PageShell } from "@/components/page-shell";
import { getRuns, getWorkflows } from "@/lib/api";

const STATUS_LABELS = {
  approval: "Approval",
  backlog: "Backlog",
  done: "Done",
  failed: "Failed",
  running: "Running"
};

export default async function DashboardPage() {
  const [runsResponse, workflowsResponse] = await Promise.all([getRuns(), getWorkflows()]);
  const latestRuns = runsResponse.runs.slice(0, 3);
  const approvalCount = runsResponse.runs.filter((run) => run.status === "approval").length;
  const runningCount = runsResponse.runs.filter((run) => run.status === "running").length;
  const totalCost = runsResponse.runs.reduce((sum, run) => sum + run.estimated_cost_usd, 0);
  const metrics = [
    ["Workflows", String(workflowsResponse.total)],
    ["Replay runs", String(runsResponse.total)],
    ["Running", String(runningCount)],
    ["Approval", String(approvalCount)]
  ];

  return (
    <PageShell
      eyebrow="Public replay demo"
      title="Operations command center"
      description={`Monitor replay runs, workflow outcomes, approval gates, and estimated cost from one workspace. Current replay cost is about $${totalCost.toFixed(2)}.`}
    >
      <div className="metrics">
        {metrics.map(([label, value]) => (
          <div className="metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="grid">
        {latestRuns.map((run) => (
          <article className="card" key={run.id}>
            <small>{STATUS_LABELS[run.status]}</small>
            <h3>{run.title}</h3>
            <p>{run.goal}</p>
            <div className="card-meta">
              <span>{run.tasks_total} tasks</span>
              <span>{run.artifacts_total} artifacts</span>
              <span>{run.tokens.toLocaleString()} tokens</span>
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
