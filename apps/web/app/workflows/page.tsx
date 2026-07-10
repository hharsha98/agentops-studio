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
        <h2>Market research pipeline preview</h2>
        <p className="section-lead">One-click execution with live status, streamed logs, and agent outputs.</p>
        <div className="pipeline-board">
          {[
            { step: "1", title: "Research competitors", agent: "Deep Research", time: "2m 14s", status: "done" },
            { step: "2", title: "Analyze market data", agent: "Knowledge Analyst", time: "1m 38s", status: "done" },
            { step: "3", title: "Draft strategy", agent: "Workflow Evaluator", time: "3m 02s", status: "running" },
            { step: "4", title: "Fact-check claims", agent: "Compliance Reviewer", time: "0m 52s", status: "backlog" }
          ].map((item) => (
            <article className={`pipeline-step ${item.status}`} key={item.step}>
              <span className="pipeline-step-index">{item.step}</span>
              <div className="pipeline-step-meta">
                <strong>{item.title}</strong>
                <small>{item.agent}</small>
              </div>
              <span className="pipeline-step-time">{item.time}</span>
            </article>
          ))}
        </div>
        <div className="flow" style={{ marginTop: 20 }}>
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
