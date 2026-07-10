import { PageShell } from "@/components/page-shell";

export default function RunsPage() {
  return (
    <PageShell
      eyebrow="Kanban execution"
      title="Track every agent run from idea to outcome"
      description="Runs move through backlog, running, approval, failed, and done states with replayable artifacts and traces."
    >
      <div className="preview-body">
        {["Backlog", "Running", "Approval", "Done"].map((lane) => (
          <div className="lane" key={lane}>
            <div className="lane-title"><span>{lane}</span><span>3</span></div>
            <div className="task">Replay task for {lane.toLowerCase()}</div>
            <div className="task">Artifact and trace attached</div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

