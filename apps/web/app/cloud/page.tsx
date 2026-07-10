import { PageShell } from "@/components/page-shell";
import { cloudTabs } from "@/lib/platform-data";

export default function CloudPage() {
  return (
    <PageShell
      eyebrow="Deployment strategy"
      title="Portable deployment from local development to managed Kubernetes."
      description="AgentOps Studio is designed for containerized delivery, infrastructure as code, secure secrets, observable services, and portable hosting."
    >
      <div className="tabs">
        {cloudTabs.map((tab, index) => (
          <article className="card" key={tab.name}>
            <small>Stage {index + 1}</small>
            <h3>{tab.name}</h3>
            <p>{tab.summary}</p>
            <div className="card-meta"><span>{tab.proof}</span></div>
          </article>
        ))}
      </div>

      <section className="diagram">
        <h2>Portable deployment architecture</h2>
        <p className="section-lead">
          The same app services run through Docker Compose, local Kubernetes, and managed Kubernetes environments.
          Provider-specific infrastructure lives in Terraform, while application deployment stays Kubernetes-native.
        </p>
        <div className="flow">
          <div className="flow-step"><strong>Frontend</strong><br /><small>Next.js product app</small></div>
          <div className="flow-step"><strong>API</strong><br /><small>FastAPI and LangGraph</small></div>
          <div className="flow-step"><strong>Data</strong><br /><small>Postgres, pgvector, Redis</small></div>
          <div className="flow-step"><strong>AI Ops</strong><br /><small>Langfuse, RAG, research</small></div>
          <div className="flow-step"><strong>Deploy</strong><br /><small>Portable managed Kubernetes</small></div>
        </div>
      </section>
    </PageShell>
  );
}
