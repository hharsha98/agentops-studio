import { PageShell } from "@/components/page-shell";
import { specializedAgents } from "@/lib/platform-data";

export default function AgentsPage() {
  return (
    <PageShell
      eyebrow="Specialist agents"
      title="Studio agents that power the live demo workflows"
      description="These six specialists are wired into the orchestration engine today. Broader workforce catalogs are a Fleet-scale concern — Studio keeps the demo honest and runnable."
    >
      <div className="grid">
        {specializedAgents.map((agent) => (
          <article className="card" key={agent.name}>
            <small>{agent.accent}</small>
            <h3>{agent.name}</h3>
            <p>{agent.description}</p>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
