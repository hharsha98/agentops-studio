import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { cloudTabs } from "@/lib/platform-data";

export default function CloudPage() {
  return (
    <PageShell
      eyebrow="Deployment"
      title="Contabo public demo on native Node and Python."
      description="This page is documentation, not a provisioner. The public host is AgentOps Studio. Agent Fleet stays on its own host and ports."
    >
      <div className="tabs">
        {cloudTabs.map((tab) => (
          <article className="card" key={tab.name}>
            <small>{tab.name}</small>
            <h3>{tab.summary}</h3>
            <p>{tab.proof}</p>
          </article>
        ))}
      </div>

      <section className="diagram">
        <h2>Contabo host layout</h2>
        <p className="section-lead">
          Public URL <strong>https://agentops.169.58.185.43.sslip.io/</strong>. Caddy terminates TLS and
          routes <code>/api/*</code> to the API. Web and API bind 0.0.0.0 on ports that do not collide
          with Agent Fleet (8000/3002) or the RAG demo (8402).
        </p>
        <div className="flow">
          <div className="flow-step"><strong>Caddy</strong><br /><small>:443 → web :3010 and /api → :8010</small></div>
          <div className="flow-step"><strong>Web</strong><br /><small>next start 0.0.0.0:3010</small></div>
          <div className="flow-step"><strong>API</strong><br /><small>uvicorn 0.0.0.0:8010, one worker</small></div>
          <div className="flow-step"><strong>Demo data</strong><br /><small>DEMO_PUBLIC seeds runs + knowledge</small></div>
        </div>
        <pre className="demo-artifact">{`bash scripts/prod-api.sh    # 0.0.0.0:8010
bash scripts/prod-web.sh    # 0.0.0.0:3010
bash scripts/smoke-public.sh`}</pre>
        <p className="muted-line">
          Unit files and the Caddy snippet: <code>infra/systemd</code>, <code>infra/caddy/agentops.Caddyfile</code>,
          and <code>docs/deployment/contabo.md</code>.
        </p>
      </section>

      <section className="diagram">
        <h2>Optional Compose</h2>
        <p className="section-lead">
          Compose is for a machine that already has Docker. It publishes the same host ports (3010/8010).
          It is not required to verify or host the public demo.
        </p>
        <pre className="demo-artifact">{`docker compose up
# optional later:
docker compose --profile infra --profile research up`}</pre>
        <p>
          <Link className="button primary" href="/dashboard">Back to the live dashboard</Link>
        </p>
      </section>
    </PageShell>
  );
}
