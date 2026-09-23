"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { ErrorBanner, GatewayBanner } from "@/components/ui";
import { api, type HealthStatus } from "@/lib/api";

export default function CloudPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [failed, setFailed] = useState(false);

  function load() {
    setFailed(false);
    api
      .health()
      .then((data) => {
        setHealth(data);
        setFailed(false);
      })
      .catch(() => {
        setHealth(null);
        setFailed(true);
      });
  }

  useEffect(() => {
    let cancelled = false;
    api
      .health()
      .then((data) => {
        if (cancelled) return;
        setHealth(data);
        setFailed(false);
      })
      .catch(() => {
        if (!cancelled) {
          setHealth(null);
          setFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell
      eyebrow="Deploy"
      title="Contabo host"
      description="This page documents the native Node and Python deploy. It does not provision machines. Agent Fleet stays on ports 8000 and 3002."
    >
      <div className="stack">
        {failed ? (
          <ErrorBanner message="Could not read /health." onRetry={load} />
        ) : (
          <GatewayBanner llm={health?.llm ?? null} persistence={health?.persistence} />
        )}
        <section className="panel">
          <h2>Process map</h2>
          <div className="card-grid">
            <article className="card">
              <h3>Caddy :443</h3>
              <p>agentops.169.58.185.43.sslip.io strips /api and proxies to 127.0.0.1:8010. Everything else goes to :3010.</p>
            </article>
            <article className="card">
              <h3>Web :3010</h3>
              <p>next start. The browser calls same-origin /api. prod-web.sh pins the fallback proxy at 127.0.0.1:8010.</p>
            </article>
            <article className="card">
              <h3>API :8010</h3>
              <p>One uvicorn worker. RAG, MCP sandbox, runs, and the OmniRoute client live here.</p>
            </article>
            <article className="card">
              <h3>OmniRoute :20128</h3>
              <p>OpenAI-compatible /v1/chat/completions on localhost. The public OmniRoute vhost is not required for runs.</p>
            </article>
          </div>
        </section>
        <section className="panel">
          <h2>API environment</h2>
          <p className="muted">
            Put the key in /etc/agentops-studio.env (mode 0600). Do not commit it. Without the key, runs stay deterministic and /health reports probe not_configured.
          </p>
          <pre>{`# /etc/systemd/system/agentops-api.service
Environment=MODEL_BASE_URL=http://127.0.0.1:20128/v1
Environment=MODEL_NAME=auto
Environment=FORCE_DETERMINISTIC=false
Environment=RUN_DB_PATH=/var/lib/agentops/studio.sqlite
EnvironmentFile=-/etc/agentops-studio.env

# /etc/agentops-studio.env
MODEL_API_KEY=replace-with-omniroute-key`}</pre>
          <p>
            <Link className="button primary" href="/dashboard">
              Back to the console
            </Link>
          </p>
        </section>
      </div>
    </PageShell>
  );
}
