import Link from "next/link";
import { PageShell } from "@/components/page-shell";

const agents = [
  {
    name: "Orchestrator",
    role: "Plans the specialist order and keeps the goal in context.",
    workflows: "Every workflow"
  },
  {
    name: "Knowledge Analyst",
    role: "Calls knowledge_search and attaches citations from the seeded corpus.",
    workflows: "All four workflows"
  },
  {
    name: "Deep Research",
    role: "Calls web_search. SearXNG when it is up, otherwise the offline fallback.",
    workflows: "Executive brief, product research"
  },
  {
    name: "Compliance Reviewer",
    role: "Checks the goal against policy excerpts and labels residual risk.",
    workflows: "Executive brief, support triage, compliance review"
  },
  {
    name: "Tool Operator",
    role: "Drafts the artifact and a sandbox Gmail note. Nothing is sent.",
    workflows: "Executive brief, support triage"
  },
  {
    name: "Workflow Evaluator",
    role: "Writes the scorecard stored on product-research runs.",
    workflows: "Product research"
  }
];

export default function AgentsPage() {
  return (
    <PageShell
      eyebrow="Agents"
      title="Specialist roster"
      description="Six roles are wired into the DAG runner. Start a workflow to see them on a run."
    >
      <div className="stack">
        <div className="row">
          <Link className="button primary" href="/workflows">
            Open workflows
          </Link>
          <Link className="button" href="/builder">
            Compose a run
          </Link>
        </div>
        <div className="card-grid">
          {agents.map((agent) => (
            <article className="card" key={agent.name}>
              <h2>{agent.name}</h2>
              <p>{agent.role}</p>
              <p className="muted">{agent.workflows}</p>
              <Link href="/workflows">Run a workflow</Link>
            </article>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
