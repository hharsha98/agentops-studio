import { PageShell } from "@/components/page-shell";
import { getWorkflows } from "@/lib/api";

import { ReplayLauncher } from "./replay-launcher";

export default async function WorkflowsPage() {
  const workflowsResponse = await getWorkflows();

  return (
    <PageShell
      eyebrow="Workflow canvas"
      title="Build and replay business workflows"
      description="Design workflow paths with agents, tools, research, approvals, and outcome artifacts in one visual workspace."
    >
      <section className="diagram">
        <div className="flow">
          <div className="flow-step"><strong>Intake</strong><br /><small>Goal and constraints</small></div>
          <div className="flow-step"><strong>Research</strong><br /><small>Web and documents</small></div>
          <div className="flow-step"><strong>Agents</strong><br /><small>Department squad</small></div>
          <div className="flow-step"><strong>Approval</strong><br /><small>Human gate</small></div>
          <div className="flow-step"><strong>Outcome</strong><br /><small>Draft, report, PR, or brief</small></div>
        </div>
      </section>
      <ReplayLauncher workflows={workflowsResponse.workflows} />
    </PageShell>
  );
}
