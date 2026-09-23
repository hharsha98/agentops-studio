"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { ErrorBanner, LoadingBlock } from "@/components/ui";
import { api, type McpTool } from "@/lib/api";

const DEFAULT_ARGS: Record<string, Record<string, unknown>> = {
  knowledge_search: { query: "executive brief policy", top_k: 2 },
  web_search: { query: "multi-agent operations platform", limit: 2 },
  slack_post: { channel: "#ops", message: "Studio sandbox ping" },
  gmail_draft: { to: "ops@example.com", subject: "Studio draft", body: "Sandbox only" },
  github_issue: { title: "Studio sandbox issue", body: "Not created on GitHub." },
  run_status: {}
};

export default function McpPage() {
  const [tools, setTools] = useState<McpTool[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [argsText, setArgsText] = useState("{}");
  const [result, setResult] = useState<string>("");
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .mcpTools()
      .then((data) => {
        if (cancelled) return;
        setTools(data.tools);
        const first = data.tools[0]?.name ?? "";
        setSelected(first);
        setArgsText(JSON.stringify(DEFAULT_ARGS[first] ?? {}, null, 2));
        setCatalogError(null);
      })
      .catch((err: Error) => {
        if (!cancelled) setCatalogError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function reload() {
    setLoading(true);
    api
      .mcpTools()
      .then((data) => {
        setTools(data.tools);
        setCatalogError(null);
      })
      .catch((err: Error) => setCatalogError(err.message))
      .finally(() => setLoading(false));
  }

  function choose(name: string) {
    setSelected(name);
    setArgsText(JSON.stringify(DEFAULT_ARGS[name] ?? {}, null, 2));
  }

  async function invoke() {
    let parsed: Record<string, unknown>;
    try {
      const value = JSON.parse(argsText) as unknown;
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("Arguments must be a JSON object");
      }
      parsed = value as Record<string, unknown>;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Invalid JSON");
      return;
    }
    setBusy(true);
    try {
      const data = await api.invokeTool(selected, parsed);
      setResult(JSON.stringify(data, null, 2));
      setActionError(data.ok ? null : data.error || "Tool returned ok: false");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Invoke failed");
    } finally {
      setBusy(false);
    }
  }

  const active = tools.find((tool) => tool.name === selected);

  return (
    <PageShell
      eyebrow="MCP"
      title="Tool registry"
      description="Edit the JSON arguments and invoke. Slack, Gmail, and GitHub stay sandbox-only on the public host."
    >
      <div className="stack">
        {catalogError ? <ErrorBanner message={catalogError} onRetry={reload} /> : null}
        {actionError ? <ErrorBanner message={actionError} /> : null}
        {loading ? <LoadingBlock label="Loading tools" /> : null}
        <div className="split">
          <div className="stack">
            {tools.map((tool) => (
              <button
                className={tool.name === selected ? "card card-button active" : "card card-button"}
                key={tool.name}
                type="button"
                onClick={() => choose(tool.name)}
              >
                <span className="mono">
                  {tool.category} · {tool.sandbox ? "sandbox" : "live"} · {tool.status}
                </span>
                <h2>{tool.name}</h2>
                <p>{tool.description}</p>
              </button>
            ))}
          </div>
          <section className="panel">
            <h2>{active?.name || "Select a tool"}</h2>
            <p className="muted">{active?.description}</p>
            <label className="field">
              Arguments
              <textarea value={argsText} onChange={(event) => setArgsText(event.target.value)} rows={10} spellCheck={false} />
            </label>
            <button className="button primary" type="button" onClick={() => void invoke()} disabled={busy || !selected}>
              {busy ? "Invoking…" : "Invoke"}
            </button>
            {result ? <pre>{result}</pre> : <p className="muted">Invoke a tool to see the result.</p>}
          </section>
        </div>
      </div>
    </PageShell>
  );
}
