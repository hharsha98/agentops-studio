"use client";

import { useEffect, useState, useTransition } from "react";
import { PageShell } from "@/components/page-shell";
import { api, type McpTool } from "@/lib/api";

export default function McpPage() {
  const [tools, setTools] = useState<McpTool[]>([]);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    api
      .mcpTools()
      .then((data) => setTools(data.tools))
      .catch((err: Error) => setError(err.message));
  }, []);

  function invoke(name: string) {
    startTransition(async () => {
      try {
        const args =
          name === "knowledge_search"
            ? { query: "executive brief policy", top_k: 2 }
            : name === "web_search"
              ? { query: "multi-agent operations platform", limit: 2 }
              : name === "slack_post"
                ? { channel: "#ops", message: "Studio sandbox ping" }
                : name === "gmail_draft"
                  ? { subject: "Studio draft", body: "Sandbox only" }
                  : name === "github_issue"
                    ? { title: "Studio sandbox issue" }
                    : {};
        const data = await api.invokeTool(name, args);
        setResult(JSON.stringify(data, null, 2));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invoke failed");
      }
    });
  }

  return (
    <PageShell
      eyebrow="MCP registry"
      title="Marketplace-style tools with safe sandbox previews"
      description="Public users can explore and invoke sandbox tools. Real GitHub/Gmail/Slack writes stay simulated in public demo mode."
    >
      {error ? <p className="demo-error">{error}</p> : null}
      <div className="grid">
        {tools.map((tool) => (
          <article className="card" key={tool.name}>
            <small>
              {tool.category} · {tool.sandbox ? "sandbox" : "live"} · {tool.status}
            </small>
            <h3>{tool.name}</h3>
            <p>{tool.description}</p>
            <button
              className="button"
              type="button"
              onClick={() => invoke(tool.name)}
              disabled={pending}
            >
              Invoke
            </button>
          </article>
        ))}
      </div>
      {result ? <pre className="demo-artifact">{result}</pre> : null}
    </PageShell>
  );
}
