# Cursor Agent Goal — AgentOps Studio

**Branch:** `cursor/ui-deploy-goal`  
**Worktree:** `/Users/harsha/Documents/AI PROJECTS/projects/agentops-studio-cursor`  
**Started:** 2026-07-10  
**Codex parallel track:** User continues backend/deploy work in `projects/agentops-studio` on `main`.

## Mission

Ship a polished, demo-ready AgentOps Studio that looks and feels like a premium AI operations product — then validate full local deployment (Docker Compose + optional k3d) so it can be merged when ready.

## Current baseline (Codex has already delivered)

| Area | Status |
|------|--------|
| Landing + product pages | Rich marketing UI, dark theme, multi-section homepage |
| FastAPI backend | Runs, workflows, knowledge, benchmarks, approvals |
| Database persistence | SQLAlchemy + SQLite local / Postgres in Compose |
| Background worker | Redis Queue (RQ), separate worker container, K8s manifest |
| Docker Compose | web, api, worker, postgres, redis + placeholders |
| Tests | 37 backend tests passing (per Task 2 report) |
| K8s manifests | API, worker, web deployments with probes |
| Terraform | AWS/GCP placeholders (not deployed) |

## Cursor track — phased plan

### Phase 1 — UI polish (this branch)
- [x] Typography and visual hierarchy (distinct display font, refined spacing)
- [x] Navigation: mobile menu, active states, smoother sticky header
- [x] Dashboard: status chips, cost highlight, quick links to runs
- [x] Shared components: status badges, section headers, empty states
- [x] Micro-interactions: hover states, subtle entrance on hero console
- [x] Accessibility pass: focus rings, contrast, reduced-motion support
- [x] **Futuristic AI theme** applied site-wide (user choice)

### Phase 2 — Product completeness
- [x] Wire remaining placeholder pages (research, MCP, traces) to feel live
- [x] Improve runs/workflows UX (run switcher, pipeline boards, colored kanban)
- [x] Add footer with repo links and deployment status

### Phase 3 — Deploy validation
- [ ] `docker compose up --build` smoke test from worktree
- [x] Document runbook in `.cursor/DEPLOY-RUNBOOK.md`
- [ ] Optional: k3d local cluster apply + health check
- [ ] Push branch to GitHub (only when user approves)

### Phase 4 — Pre-merge
- [ ] Full test suite green
- [ ] Side-by-side UI comparison notes vs friend's site
- [ ] Open PR for user review; merge only after explicit approval

## Non-goals (Codex owns these)

- AWS/GCP live deployment
- Redis transactional outbox / orphan job reconciler
- New backend features unless required for UI wiring

## Success criteria

1. UI feels premium, cohesive, and clearly better than a generic template.
2. `docker compose up --build` serves web + api + worker without manual fixes.
3. All existing tests still pass.
4. Changes live only on `cursor/ui-deploy-goal` until user merges.

## How to run this worktree

```bash
cd "/Users/harsha/Documents/AI PROJECTS/projects/agentops-studio-cursor"
npm run dev:web          # frontend on :3010 (3010 avoids conflict with Codex on :3000)

cd apps/api
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

## Progress log

- **2026-07-10** — Created isolated git worktree on `cursor/ui-deploy-goal`. Analysis complete. Awaiting user UI direction before large visual changes.
- **2026-07-10** — UI polish pass: nav mobile menu, footer, Syne display font, tech marquee, status badges, design-preview vibe page, richer inner pages (agents, research, MCP, traces, dashboard, workflows pipeline, benchmarks score bars).
- **2026-07-10** — User chose Futuristic AI; applied `data-theme="futuristic"` globally with glow, gradient headlines, run switcher, port 3010, deploy runbook.
- **2026-07-10** — User chose **Electric Violet** (`#a855f7`) as permanent secondary accent; pale green removed.
