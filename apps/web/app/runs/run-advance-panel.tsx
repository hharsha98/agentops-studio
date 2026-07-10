"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { approveRunAction, advanceRunAction, createWorkerJobAction, tickWorkerJobAction } from "./actions";
import type { AdvanceActionState, ApprovalActionState, WorkerActionState } from "./actions";

type RunAdvancePanelProps = {
  runId: string;
  status: string;
};

const initialAdvanceState: AdvanceActionState = {
  status: "idle",
  message: ""
};

const initialApprovalState: ApprovalActionState = {
  status: "idle",
  message: ""
};

const initialWorkerState: WorkerActionState = {
  status: "idle",
  message: ""
};

function ActionButton({ disabled, idleText, pendingText }: { disabled: boolean; idleText: string; pendingText: string }) {
  const { pending } = useFormStatus();

  return (
    <button className="button primary" disabled={disabled || pending} type="submit">
      {pending ? pendingText : idleText}
    </button>
  );
}

export function RunAdvancePanel({ runId, status }: RunAdvancePanelProps) {
  const [advanceState, advanceFormAction] = useActionState(advanceRunAction, initialAdvanceState);
  const [approvalState, approvalFormAction] = useActionState(approveRunAction, initialApprovalState);
  const [workerState, createWorkerFormAction] = useActionState(createWorkerJobAction, initialWorkerState);
  const [tickState, tickWorkerFormAction] = useActionState(tickWorkerJobAction, initialWorkerState);
  const isTerminal = status === "done" || status === "failed";
  const isApproval = status === "approval";
  const activeJobId = tickState.jobId ?? workerState.jobId;

  return (
    <section className="advance-panel">
      <div>
        <strong>Execution control</strong>
        <span>{isApproval ? "Approve the reviewed artifact and release the workflow outcome." : "Advance the selected run one agent step and refresh the trace."}</span>
      </div>
      {isApproval ? (
        <form action={approvalFormAction}>
          <input name="runId" type="hidden" value={runId} />
          <ActionButton disabled={isTerminal} idleText="Approve outcome" pendingText="Approving..." />
        </form>
      ) : (
        <form action={advanceFormAction}>
          <input name="runId" type="hidden" value={runId} />
          <ActionButton disabled={isTerminal} idleText="Advance run" pendingText="Advancing..." />
        </form>
      )}
      {advanceState.status !== "idle" ? (
        <p className={`inline-status ${advanceState.status}`} role="status">{advanceState.message}</p>
      ) : null}
      {approvalState.status !== "idle" ? (
        <p className={`inline-status ${approvalState.status}`} role="status">{approvalState.message}</p>
      ) : null}
      <form action={createWorkerFormAction}>
        <input name="runId" type="hidden" value={runId} />
        <ActionButton disabled={isTerminal || isApproval} idleText="Queue worker job" pendingText="Queueing..." />
      </form>
      {activeJobId ? (
        <form action={tickWorkerFormAction}>
          <input name="jobId" type="hidden" value={activeJobId} />
          <ActionButton disabled={isTerminal || tickState.jobStatus === "waiting_for_approval" || workerState.jobStatus === "waiting_for_approval"} idleText="Run worker step" pendingText="Running..." />
        </form>
      ) : null}
      {workerState.status !== "idle" ? (
        <p className={`inline-status ${workerState.status}`} role="status">{workerState.message}</p>
      ) : null}
      {tickState.status !== "idle" ? (
        <p className={`inline-status ${tickState.status}`} role="status">{tickState.message}</p>
      ) : null}
    </section>
  );
}
