import { PageShell } from "@/components/page-shell";

export default function BenchmarksPage() {
  return (
    <PageShell
      eyebrow="Benchmark scorecard"
      title="Measure reliability, quality, speed, safety, and cost"
      description="The benchmark suite uses 50 synthetic workflow scenarios with deterministic checks and optional LLM judging."
    >
      <div className="metrics">
        {[
          ["Scenarios", "50"],
          ["Target success", "85%"],
          ["Approval safety", "100%"],
          ["Replay coverage", "10"]
        ].map(([label, value]) => (
          <div className="metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
