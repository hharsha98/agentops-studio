# Autonomous delivery loop — AgentOps Studio

**True end goal:** Fully functional local deployment + AWS-ready stack, with continuous Reticle agent verification.

**Branch:** `cursor/ui-deploy-goal` only — **no merge to `main`** until you decide.

**Roadmap:** See `.cursor/ROADMAP.md` for all 5 phases.

## Current phase: **1 — Compose truth** (IN PROGRESS)

The old loop only validated a **demo shell** (~85% UI, ~45% local deploy, ~10% AWS). It is **not finished**.

## Loop cycle (runs until Phase 5 complete)

```
setup keys → Redis + worker → pytest → build → E2E → agent eval (9+ checks) → LLM eval → compose smoke → commit branch
```

## Gates per cycle

| Gate | Command | Target |
|------|---------|--------|
| Reticle keys | `npm run setup:reticle` | FreeLLMAPI + Gemini in Reticle DB |
| Redis + RQ worker | auto in `npm run loop` | worker job eval can pass |
| API unit | `pytest -q` in `apps/api` | 37+ pass |
| Web E2E | `npm run test:e2e:web` | 14+ pass |
| Agent outcomes | `npm run eval:agent` | **9 checks** (worker + 3 workflows) |
| LLM eval | `npm run eval:llm` | 3 FreeLLMAPI checks |
| Compose smoke | `npm run eval:compose` | worker via Docker |
| Phase status | `.cursor/PHASE-STATUS.json` | `loop_complete: false` until Phase 5 |

## Reticle

- Desktop: `open tools/reticle/Reticle.app`
- Headless mirror: `npm run eval:agent` + `npm run eval:llm`
- Import pack: `tools/reticle/evals/`

## Cycle log

### Cycle 1 — 2026-07-10
- Demo shell gates (pytest, E2E, 5 agent checks) — **not full product**

### Cycle 2 — 2026-07-10
- FreeLLMAPI wired from career-ops

### Cycle 3 — 2026-07-10
- Roadmap + Phase 1 started: expanded evals, compose smoke, Redis/worker in loop
