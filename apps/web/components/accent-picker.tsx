"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type AccentId = "violet" | "cyan" | "magenta" | "amber" | "coral";

export const ACCENT_OPTIONS: {
  id: AccentId;
  name: string;
  description: string;
  hex: string;
}[] = [
  {
    id: "violet",
    name: "Electric Violet",
    description: "Rich purple glow — cyberpunk lab, pairs well with blue.",
    hex: "#a855f7"
  },
  {
    id: "cyan",
    name: "Cyber Cyan",
    description: "Bright teal-cyan — clean sci-fi, high contrast on dark UI.",
    hex: "#06b6d4"
  },
  {
    id: "magenta",
    name: "Neon Magenta",
    description: "Vivid pink-purple — bold, energetic, very futuristic.",
    hex: "#e879f9"
  },
  {
    id: "amber",
    name: "Solar Amber",
    description: "Deep gold — warm and premium, not pale or washed out.",
    hex: "#f59e0b"
  },
  {
    id: "coral",
    name: "Plasma Coral",
    description: "Warm rose-coral — softer than magenta, still vivid.",
    hex: "#fb7185"
  }
];

const STORAGE_KEY = "agentops-accent-preview";

export function AccentPicker() {
  const [selected, setSelected] = useState<AccentId | null>(() => {
    if (typeof window === "undefined") {
      return "violet";
    }
    const saved = window.localStorage.getItem(STORAGE_KEY) as AccentId | null;
    return saved && ACCENT_OPTIONS.some((option) => option.id === saved) ? saved : "violet";
  });

  useEffect(() => {
    if (selected) {
      document.documentElement.setAttribute("data-accent", selected);
    }
  }, [selected]);

  function chooseAccent(id: AccentId) {
    setSelected(id);
    document.documentElement.setAttribute("data-accent", id);
    window.localStorage.setItem(STORAGE_KEY, id);
  }

  return (
    <section className="diagram">
      <h2>Pick your secondary accent color</h2>
      <p className="section-lead">
        The pale green is the secondary accent in gradients, glows, and status dots. Click a swatch to preview it
        live on this site — then browse other pages. Tell me your pick in chat and I will lock it in permanently.
      </p>
      <div className="accent-grid">
        {ACCENT_OPTIONS.map((option) => (
          <button
            className={`accent-card ${selected === option.id ? "selected" : ""}`}
            key={option.id}
            onClick={() => chooseAccent(option.id)}
            style={{ "--accent-preview": option.hex } as React.CSSProperties}
            type="button"
          >
            <span className="accent-swatch" />
            <strong>{option.name}</strong>
            <small>{option.hex}</small>
            <p>{option.description}</p>
            <div className="accent-mini-bar" />
          </button>
        ))}
      </div>
      {selected ? (
        <div className="vibe-choice-banner" role="status" style={{ marginTop: 20 }}>
          <strong>Previewing: {ACCENT_OPTIONS.find((option) => option.id === selected)?.name}</strong>
          <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
            Open <Link href="/">Home</Link>, <Link href="/runs">Runs</Link>, or <Link href="/traces">Traces</Link> to see it everywhere.
            Reply in chat with the name (e.g. &quot;Electric Violet&quot;) to make it permanent.
          </p>
        </div>
      ) : null}
    </section>
  );
}
