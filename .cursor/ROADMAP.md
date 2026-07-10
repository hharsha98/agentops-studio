# AgentOps Studio — Full delivery roadmap

**Branch:** `cursor/ui-deploy-goal` (no merge to `main` until you approve)  
**True end goal:** Fully workable local deployment + AWS-deployable production stack, with **continuous Reticle-aligned agent verification**.

## Honest status (2026-07-10)

| Target | Grade | Notes |
|--------|-------|-------|
| Polished demo UI + replay API | ~85% | E2E + pytest green |
| Fully functional local deployment | ~45% | Compose unproven, dev-only web, no real LLM |
| AWS-ready | ~10% | K8s skeleton, no Terraform, no CI |

**The current `npm run loop` only proves the demo shell — not production readiness.**

---

## Phase 1 — Compose truth (IN PROGRESS)

Prove Postgres + Redis + API + worker + web work together.

**Build:**
- `scripts/compose-smoke.sh` — full stack smoke on `:8000` / `:3010`
- Worker job lifecycle in `scripts/agent-outcome-eval.py`
- All 3 workflow replays in eval + Reticle pack
- `/ready` checks Redis when `REQUIRE_REDIS_FOR_READY=true`
- Loop starts Redis + RQ worker when needed

**Exit criteria:**
- [ ] `compose-smoke.sh` exits 0
- [ ] Worker job reaches `waiting_for_approval` or `completed` without manual advance
- [ ] Agent eval ≥ 10 checks (worker + 3 workflows)
- [ ] Added to `npm run loop`

---

## Phase 2 — Production-shaped local stack

**Build:** `apps/web/Dockerfile`, prod web in Compose, API-required Playwright tests, worker healthcheck.

**Exit criteria:**
- [ ] Compose uses production web image (no `npm install` on start)
- [ ] `/ready` returns 503 when Redis required and down
- [ ] Playwright test fails when API is down (no silent fallback)

---

## Phase 3 — Real agent / LLM step

**Build:** HTTP client to FreeLLMAPI, one workflow step calls a model, token metrics from real usage.

**Exit criteria:**
- [ ] Trace event contains real model output
- [ ] `eval:llm` + API eval assert LLM boundary
- [ ] Reticle pack includes LLM-judge on agent output

---

## Phase 4 — AWS foundation

**Build:** `infra/terraform/aws/*.tf`, complete K8s (Ingress, secrets), GitHub Actions CI.

**Exit criteria:**
- [ ] `terraform apply` creates EKS + RDS + ElastiCache
- [ ] `kubectl apply` — pods ready, public URL serves `/ready`
- [ ] CI green on PR

---

## Phase 5 — Product completeness

**Build:** Wire research/MCP/traces to API, SearXNG integration, expand demo data, private mode.

**Exit criteria:**
- [ ] No critical pages are 100% static mock
- [ ] Reticle eval covers all agent surfaces
- [ ] `PUBLIC_DEMO_MODE=false` path tested

---

## Continuous loop definition

Each cycle until **Phase 5 exit criteria** are met:

```
setup keys → unit tests → build → E2E → agent eval (Reticle mirror) → LLM eval → compose smoke (Phase 1+) → fix gaps → commit branch
```

**Not "done" until:** local `docker compose up` is production-shaped AND AWS IaC deploys AND agents are Reticle-verified with real LLM steps.
