import { Bot } from "lucide-react";

import { PageShell } from "@/components/page-shell";
import { specializedAgents, workforceSquads } from "@/lib/platform-data";

export default function AgentsPage() {
  return (
    <PageShell
      description="Agents are grouped by business outcome, so the platform feels useful to teams instead of looking like a random agent list."
      eyebrow="30-agent workforce"
      title="Specialized agents, ready to deploy"
    >
      <div className="agent-pill-grid">
        {specializedAgents.map((agent) => (
          <span className={`agent-pill accent-${agent.accent}`} key={agent.name}>
            <Bot size={16} />
            {agent.name}
            <small>{agent.accent}</small>
          </span>
        ))}
      </div>

      <section className="diagram">
        <h2>Department squads for business operations</h2>
        <p className="section-lead">
          Each squad bundles prompts, tools, model settings, approval rules, traces, and schemas in the runtime builder.
        </p>
        <div className="grid">
          {workforceSquads.map((squad) => (
            <article className={`card accent-${squad.accent}`} key={squad.name}>
              <small>{squad.agents}</small>
              <h3>{squad.name}</h3>
              <p>{squad.tools}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="diagram">
        <h2>Built-in agent roster</h2>
        <div className="agent-roster">
          {specializedAgents.map((agent) => (
            <article className={`agent-card accent-${agent.accent}`} key={agent.name}>
              <Bot size={20} />
              <h3>{agent.name}</h3>
              <p>{agent.description}</p>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
