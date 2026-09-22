import { PageShell } from "@/components/page-shell";
import { cloudTabs } from "@/lib/platform-data";

export default function CloudPage() {
  return (
    <PageShell
      eyebrow="Deployment strategy"
      title="Native-first demo, optional containers and Kubernetes scaffolding."
      description="The hiring-manager path is Node + Python with no Docker. Compose, k3d, and Terraform blueprints are optional scaffolding for machines that have those tools."
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
        <h2>Demo vs scaffolding</h2>
        <p className="section-lead">
          Today the live demo is an in-memory FastAPI store + TF-IDF RAG + internal traces. Optional Compose
          profiles and k8s/Terraform docs prepare a fuller stack without requiring it for the demo.
        </p>
        <div className="flow">
          <div className="flow-step"><strong>Frontend</strong><br /><small>Next.js (native :3000)</small></div>
          <div className="flow-step"><strong>API</strong><br /><small>FastAPI + DAG orchestrator</small></div>
          <div className="flow-step"><strong>Knowledge</strong><br /><small>Seeded markdown RAG</small></div>
          <div className="flow-step"><strong>Traces</strong><br /><small>Internal spans (Langfuse optional later)</small></div>
          <div className="flow-step"><strong>Optional</strong><br /><small>Compose / k3d / Terraform docs</small></div>
        </div>
      </section>
    </PageShell>
  );
}
