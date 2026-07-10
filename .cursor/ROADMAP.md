# AgentOps Studio — Local-first delivery roadmap

**Branch:** `cursor/ui-deploy-goal` (no merge to `main` until you approve)  
**Strategy:** Fully build and verify **locally** first — Docker Compose → **local Kubernetes (k3d)** → defer AWS/GCP until the app works end-to-end on your machine.

## Honest status (2026-07-10)

| Target | Grade | Notes |
|--------|-------|-------|
| Demo UI + replay API | ~90% | E2E + pytest green |
| Docker Compose full stack | ~85% | Prod web + compose smoke on alt ports |
| Local Kubernetes (k3d) | ~90% | `npm run eval:k8s` passed; cluster `agentops-studio` |
| AWS / GCP | **Deferred** | Plans only in `infra/terraform/*/README.md` |

---

## Phase 1 — Docker Compose truth (MOSTLY DONE)

Prove Postgres + Redis + API + worker (+ web) work together in Docker.

**Exit criteria:**
- [x] Agent eval 9+ checks (worker + 3 workflows + optional LLM)
- [x] `compose-smoke.sh` for api + worker path
- [x] Full compose including **production web image**
- [ ] `npm run loop` compose smoke green every cycle

---

## Phase 2 — Production-shaped local Docker (DONE)

**Build:** `apps/web/Dockerfile`, prod web in Compose, worker healthcheck, API-required E2E option.

**Exit criteria:**
- [x] `docker compose up` uses built images (no `npm install` on start)
- [x] Web serves production `next build` on `:3010`
- [x] `/ready` returns 503 when Redis required and down

---

## Phase 3 — Real agent / LLM step (DONE)

**Build:** FreeLLMAPI client in API, one workflow step calls a model, Reticle LLM-judge on real output.

**Exit criteria:**
- [x] `llm_client.py` + trace `llm_completion` when `ENABLE_LIVE_LLM=true`
- [x] Integration test for LLM trace on advance
- [x] `eval:llm` + API eval assert LLM boundary every cycle

---

## Phase 4 — Product completeness (local) (DONE)

**Build:** Wire research/MCP/traces to API, SearXNG hook, expand workflows, `PUBLIC_DEMO_MODE=false` path.

**Exit criteria:**
- [x] Research/MCP/Traces pages fetch `/research/overview`, `/mcp/tools`, `/traces/summary`
- [x] Reticle eval covers agent surfaces check

---

## Phase 5 — Local Kubernetes (k3d) (DONE)

**Build:** Build/load images, `kubectl apply` base manifests, pods ready against host Compose Postgres/Redis (or in-cluster later).

**Exit criteria:**
- [x] `npm run eval:k8s` — api + web + worker pods ready, `/ready` OK
- [x] Documented flow in `infra/k8s/local/README.md`
- [x] k3d installed locally (`brew install k3d`); cluster `agentops-studio` on LB port **3020**

---

## Phase 6 — AWS / GCP (DEFERRED)

**Not in scope until Phases 1–5 pass on your machine.**

Terraform, EKS/GKE, managed RDS — revisit only after local Docker + local k8d are fully working.

---

## Continuous loop

```
setup keys → Redis + worker → pytest → build → E2E → agent eval → LLM eval → compose smoke → (optional k8s smoke) → commit branch
```

**Done when:** Full app works in **local Docker** and **local k8d pods**, with Reticle-verified agents and real LLM steps — **not** when AWS exists.
