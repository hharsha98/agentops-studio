"use client";

import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { AccentPicker } from "@/components/accent-picker";
import { StatusBadge } from "@/components/status-badge";

export default function DesignPreviewPage() {
  return (
    <PageShell
      description="Electric Violet is locked in as the site accent — rich purple glow across gradients, traces, and status UI."
      eyebrow="Design direction"
      title="Electric Violet accent"
    >
      <div className="vibe-choice-banner" role="status">
        <StatusBadge label="Active accent" status="live" />
        <strong style={{ display: "block", marginTop: 12 }}>Electric Violet (#a855f7)</strong>
        <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
          Applied permanently on this branch. Browse <Link href="/">Home</Link> or <Link href="/traces">Traces</Link> to see the purple glow.
        </p>
      </div>

      <AccentPicker />

      <div className="vibe-choice-banner" role="status" style={{ marginTop: 24 }}>
        <StatusBadge label="Active theme" status="live" />
        <strong style={{ display: "block", marginTop: 12 }}>Futuristic AI applied site-wide</strong>
        <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
          Gradient headlines, glowing cards, trace waterfalls, and animated console preview are enabled on all routes.
        </p>
      </div>

      <div className="vibe-grid" style={{ marginTop: 24 }}>
        <article className="vibe-card selected" style={{ cursor: "default" }}>
          <div className="vibe-preview futuristic">
            <StatusBadge label="Live orchestration" status="live" />
            <div className="vibe-preview-panel" style={{ marginTop: 16 }}>
              <strong style={{ fontSize: 28, display: "block", marginBottom: 8 }}>Neon agent runtime</strong>
              <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.5 }}>
                Your chosen direction — bold glow, animated status, and cinematic depth.
              </p>
              <div className="waterfall" style={{ marginTop: 14 }}>
                <div className="waterfall-row">
                  <span className="waterfall-label">Research</span>
                  <div className="waterfall-bar-wrap"><div className="waterfall-bar" style={{ width: "72%" }} /></div>
                  <span className="waterfall-duration">2m 14s</span>
                </div>
                <div className="waterfall-row">
                  <span className="waterfall-label">Brief</span>
                  <div className="waterfall-bar-wrap"><div className="waterfall-bar" style={{ width: "48%" }} /></div>
                  <span className="waterfall-duration">1m 02s</span>
                </div>
              </div>
            </div>
          </div>
          <div className="vibe-card-body">
            <h3>Futuristic AI</h3>
            <p>Active across homepage, dashboard, workflows, runs, and all product pages.</p>
          </div>
        </article>

        <article className="vibe-card" style={{ cursor: "default", opacity: 0.72 }}>
          <div className="vibe-preview enterprise">
            <StatusBadge label="Not selected" status="sandbox" />
            <div className="vibe-preview-panel" style={{ marginTop: 16 }}>
              <strong style={{ fontSize: 28, display: "block", marginBottom: 8 }}>Enterprise SaaS</strong>
              <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.5 }}>
                Minimal alternative — available if you want to switch later.
              </p>
            </div>
          </div>
          <div className="vibe-card-body">
            <h3>Enterprise SaaS</h3>
            <p>Reserved option. Say the word if you want to try this instead.</p>
          </div>
        </article>
      </div>
    </PageShell>
  );
}
