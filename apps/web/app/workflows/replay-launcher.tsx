"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { WorkflowTemplate } from "@/lib/api";

import { startReplayAction } from "./actions";
import type { ReplayActionState } from "./actions";

type ReplayLauncherProps = {
  workflows: WorkflowTemplate[];
};

const initialReplayActionState: ReplayActionState = {
  status: "idle",
  message: ""
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="button primary" disabled={pending} type="submit">
      {pending ? "Starting..." : "Start replay"}
    </button>
  );
}

export function ReplayLauncher({ workflows }: ReplayLauncherProps) {
  const [state, formAction] = useActionState(startReplayAction, initialReplayActionState);

  return (
    <section className="replay-panel">
      <div className="section-heading compact">
        <span>Replay launcher</span>
        <h2>Start a workflow run from the canvas</h2>
        <p>
          Pick a workflow, describe the operating goal, and create a run that can be inspected from the execution board.
        </p>
      </div>

      {state.status !== "idle" ? (
        <div className={`status-note ${state.status}`} role="status">
          <strong>{state.status === "success" ? "Run created" : "Replay not started"}</strong>
          <span>{state.message}</span>
          {state.runId ? (
            <Link href={`/runs?runId=${state.runId}`}>
              Open {state.runTitle ?? "run"}
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="grid">
        {workflows.map((workflow) => (
          <article className="card replay-card" key={workflow.id}>
            <small>{workflow.risk_level} risk · {workflow.estimated_minutes} min replay</small>
            <h3>{workflow.name}</h3>
            <p>{workflow.description}</p>
            <div className="card-meta">
              <span>{workflow.artifact_type}</span>
              <span>{workflow.agents.length} agents</span>
            </div>
            <form action={formAction} className="replay-form">
              <input name="workflowId" type="hidden" value={workflow.id} />
              <label>
                Goal
                <textarea
                  defaultValue={`Run ${workflow.name.toLowerCase()} for the current operating priority.`}
                  maxLength={500}
                  minLength={8}
                  name="goal"
                  rows={3}
                />
              </label>
              <SubmitButton />
            </form>
          </article>
        ))}
      </div>
    </section>
  );
}
