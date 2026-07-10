import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { getRun, getRuns } from "@/lib/api";

import { RunAdvancePanel } from "./run-advance-panel";

const LANES = ["backlog", "running", "approval", "done"] as const;

const LANE_LABELS = {
  approval: "Approval",
  backlog: "Backlog",
  done: "Done",
  running: "Running"
};

type RunsPageProps = {
  searchParams?: Promise<{
    runId?: string;
  }>;
};

export default async function RunsPage({ searchParams }: RunsPageProps) {
  const params = await searchParams;
  const runsResponse = await getRuns();
  const selectedRunId = params?.runId ?? runsResponse.runs[0]?.id ?? "run-executive-brief";
  const selectedRun = await getRun(selectedRunId);
  const tasks = selectedRun?.tasks ?? [];

  return (
    <PageShell
      eyebrow="Kanban execution"
      title="Track every agent run from idea to outcome"
      description={selectedRun ? `${selectedRun.title}: ${selectedRun.goal}` : "Runs move through backlog, running, approval, failed, and done states with replayable artifacts and traces."}
    >
      <nav aria-label="Run list" className="run-switcher">
        {runsResponse.runs.map((run) => (
          <Link
            className={run.id === selectedRunId ? "active" : ""}
            href={`/runs?runId=${run.id}`}
            key={run.id}
          >
            {run.title}
          </Link>
        ))}
      </nav>
      {selectedRun ? (
        <div className="run-summary">
          <div><span>Status</span><strong>{LANE_LABELS[selectedRun.status as keyof typeof LANE_LABELS] ?? selectedRun.status}</strong></div>
          <div><span>Agents</span><strong>{selectedRun.agents.length}</strong></div>
          <div><span>Trace events</span><strong>{selectedRun.trace.length}</strong></div>
          <div><span>Artifacts</span><strong>{selectedRun.artifacts.length}</strong></div>
        </div>
      ) : null}
      {selectedRun ? (
        <RunAdvancePanel runId={selectedRun.id} status={selectedRun.status} />
      ) : null}
      <div className="preview-body">
        {LANES.map((lane) => (
          <div className={`lane ${lane}-lane`} key={lane}>
            <div className="lane-title">
              <span>{LANE_LABELS[lane]}</span>
              <span>{tasks.filter((task) => task.status === lane).length}</span>
            </div>
            {tasks.filter((task) => task.status === lane).map((task) => (
              <div className={`task ${lane}-task`} key={task.id}>
                <strong>{task.title}</strong>
                <small>{task.agent} · {task.priority} priority</small>
              </div>
            ))}
            {tasks.every((task) => task.status !== lane) ? (
              <div className="task muted-task">No tasks in this lane</div>
            ) : null}
          </div>
        ))}
      </div>
      {selectedRun ? (
        <section className="diagram">
          <h2>Trace and artifacts</h2>
          <div className="trace-grid">
            {selectedRun.trace.map((event) => (
              <article className="trace-row" key={event.id}>
                <span>{event.type}</span>
                <strong>{event.title}</strong>
                <small>{event.agent}: {event.detail}</small>
              </article>
            ))}
          </div>
          <div className="artifact-list">
            {selectedRun.artifacts.map((artifact) => (
              <article className="card" key={artifact.id}>
                <small>{artifact.requires_approval ? "Approval required" : "Replay artifact"}</small>
                <h3>{artifact.title}</h3>
                <p>{artifact.summary}</p>
                <div className="card-meta">
                  {artifact.citations.map((citation) => <span key={citation}>{citation}</span>)}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </PageShell>
  );
}
