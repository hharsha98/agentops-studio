import { PageShell } from "@/components/page-shell";

const squads = [
  "Core Platform",
  "Support",
  "Revenue",
  "Marketing",
  "Finance",
  "People",
  "Product",
  "Engineering",
  "Compliance",
  "Executive Ops"
];

export default function AgentsPage() {
  return (
    <PageShell
      eyebrow="30-agent workforce"
      title="Department squads for business operations"
      description="Agents are grouped by business outcome, so the platform feels useful to teams instead of looking like a random agent list."
    >
      <div className="grid">
        {squads.map((squad) => (
          <article className="card" key={squad}>
            <small>Squad</small>
            <h3>{squad}</h3>
            <p>Prompts, tools, model settings, approval rules, traces, and schemas are managed in the runtime builder.</p>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
