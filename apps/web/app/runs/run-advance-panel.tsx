"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { advanceRunAction } from "./actions";
import type { AdvanceActionState } from "./actions";

type RunAdvancePanelProps = {
  runId: string;
  status: string;
};

const initialAdvanceState: AdvanceActionState = {
  status: "idle",
  message: ""
};

function AdvanceButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button className="button primary" disabled={disabled || pending} type="submit">
      {pending ? "Advancing..." : "Advance run"}
    </button>
  );
}

export function RunAdvancePanel({ runId, status }: RunAdvancePanelProps) {
  const [state, formAction] = useActionState(advanceRunAction, initialAdvanceState);
  const isTerminal = status === "done" || status === "failed";

  return (
    <form action={formAction} className="advance-panel">
      <input name="runId" type="hidden" value={runId} />
      <div>
        <strong>Execution control</strong>
        <span>Advance the selected run one agent step and refresh the trace.</span>
      </div>
      <AdvanceButton disabled={isTerminal} />
      {state.status !== "idle" ? (
        <p className={`inline-status ${state.status}`} role="status">{state.message}</p>
      ) : null}
    </form>
  );
}
