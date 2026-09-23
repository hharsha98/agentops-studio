"use client";

import { useEffect, useState } from "react";
import { api, type HealthStatus } from "@/lib/api";

export function LiveStatus() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .health()
      .then((data) => {
        if (!cancelled) setHealth(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="status-strip" role="alert">
        <span>API unreachable</span>
        <strong>{error}</strong>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="status-strip" role="status">
        <span>API</span>
        <strong>Checking health…</strong>
      </div>
    );
  }

  return (
    <div className="status-strip" role="status">
      <span>
        API <strong>{health.status}</strong>
      </span>
      <span>
        Runs <strong>{health.runs}</strong>
      </span>
      <span>
        Knowledge <strong>{health.knowledge_documents}</strong>
      </span>
      <span>
        Tools <strong>{health.mcp_tools}</strong>
      </span>
      <span>
        Model <strong>{health.llm.mode}</strong>
      </span>
      <span>
        Gateway <strong>{health.llm.base_host}</strong>
      </span>
    </div>
  );
}
