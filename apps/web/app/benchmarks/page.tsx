import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export default function BenchmarksPage() {
  return (
    <PageShell
      eyebrow="Evaluation"
      title="There is no benchmark suite in this demo."
      description="A 50-scenario scorecard is not running. Workflows that include the evaluator attach a deterministic note for completeness, citations, sandbox safety, and offline cost."
    >
      <article className="card">
        <small>What you can inspect</small>
        <h3>Per-run traces</h3>
        <p>
          Open Traces after a product-research run. The evaluator span is part of that run, not a
          separate lab.
        </p>
        <Link className="button primary" href="/traces">Open traces</Link>
      </article>
    </PageShell>
  );
}
