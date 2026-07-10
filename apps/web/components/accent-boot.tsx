"use client";

import { useEffect } from "react";

import { ACCENT_OPTIONS, type AccentId } from "./accent-picker";

const STORAGE_KEY = "agentops-accent-preview";

export function AccentBoot() {
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as AccentId | null;
    const accent = saved && ACCENT_OPTIONS.some((option) => option.id === saved) ? saved : "violet";
    document.documentElement.setAttribute("data-accent", accent);
  }, []);

  return null;
}
