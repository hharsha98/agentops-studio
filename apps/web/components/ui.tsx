"use client";

import type { LlmStatus } from "@/lib/api";

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

export function ErrorBanner({
  message,
  onRetry
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="banner banner-error" role="alert">
      <p>{message}</p>
      {onRetry ? (
        <button className="button" type="button" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

export function LoadingBlock({ label = "Loading" }: { label?: string }) {
  return (
    <div className="loading" role="status">
      <span className="spinner" aria-hidden="true" />
      {label}
    </div>
  );
}

export function GatewayBanner({
  llm,
  persistence
}: {
  llm: LlmStatus | null;
  persistence?: string;
}) {
  if (!llm) {
    return (
      <div className="banner" role="status">
        <p>Checking the model gateway…</p>
      </div>
    );
  }

  let tone = "warn";
  let text = `Templates only. OmniRoute at ${llm.base_host} is not configured (${llm.probe_detail}).`;
  if (llm.configured && (llm.probe === "ok" || llm.probe === "pending")) {
    tone = "ok";
    text = `Live runs call OmniRoute at ${llm.base_host} with model ${llm.model}. ${llm.probe_detail}.`;
  } else if (llm.configured && (llm.probe === "auth_failed" || llm.probe === "unreachable")) {
    tone = "error";
    text = `OmniRoute at ${llm.base_host} is not usable (${llm.probe}). ${llm.probe_detail}. New runs finish in degraded mode.`;
  } else if (llm.force_deterministic && llm.probe === "skipped") {
    tone = "warn";
    text = `OmniRoute target is ${llm.base_host}, but FORCE_DETERMINISTIC is on. Runs stay on templates.`;
  }

  return (
    <div className={`banner banner-${tone}`}>
      <p>
        {text}
        {persistence ? ` Store: ${persistence}.` : ""}
      </p>
    </div>
  );
}

export function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
