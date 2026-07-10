# Final execution goal — AgentOps Studio (Cursor branch)

**Branch:** `cursor/ui-deploy-goal`  
**Theme:** Futuristic AI + Electric Violet (`#a855f7`)  
**Web:** http://localhost:3010  
**Status:** UI committed and pushed; final validation in progress.

## Mission

Ship a demo-ready, visually polished AgentOps Studio that passes end-to-end web verification and is ready to merge into `main` when Codex work is compatible.

## Phase A — UI and branding (done)
- [x] Futuristic AI theme site-wide
- [x] Electric Violet accent locked in
- [x] All product pages polished vs useful-agents.com baseline
- [x] Committed and pushed to `cursor/ui-deploy-goal`

## Phase B — E2E web verification (in progress)
- [ ] Critical user journeys pass on port 3010
- [ ] Playwright live browser audit (homepage, nav, dashboard, workflows, runs, design-preview)
- [ ] Playwright test suite in repo for repeat runs (`apps/web/e2e/`)
- [ ] Reticle note: [Reticle](https://reticle.run) targets LLM/agent evals; web UI E2E uses Playwright here

### E2E journeys to verify
1. Homepage loads — hero, tech marquee, footer, violet gradient headline
2. Nav — all primary links resolve
3. Design preview — Electric Violet banner visible
4. Dashboard — metrics cards render
5. Workflows — pipeline board + replay launcher visible
6. Runs — run switcher + kanban lanes
7. Static pages — agents, research, mcp, traces, builder, cloud

## Phase C — Deploy validation
- [ ] `docker compose up --build` smoke test (web :3010, api :8000)
- [ ] Backend pytest suite green in worktree
- [ ] Update DEPLOY-RUNBOOK with E2E commands

## Phase D — Merge readiness
- [ ] Open PR `cursor/ui-deploy-goal` → `main`
- [ ] User reviews side-by-side with Codex `main`
- [ ] Merge only after explicit approval

## Progress log
- **2026-07-10** — Committed + pushed UI branch. Final execution goal created. E2E verification started.
