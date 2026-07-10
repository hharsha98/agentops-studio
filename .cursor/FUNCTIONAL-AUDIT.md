# Functional audit — local prototype

**Generated:** 2026-07-10T18:42:18.192697+00:00
**Verdict:** `NOT_READY`

Core functional gaps remain — see failed layers.

## Layer results

| Layer | Status |
|-------|--------|
| API unit tests (pytest) | **PASS** |
| Reticle-mirror agent eval | **PASS** |
| Reticle-mirror LLM eval (FreeLLMAPI) | **PASS** |
| Playwright smoke (pages load) | **FAIL** |
| Playwright functional (buttons/forms) | **PASS** |
| Docker Compose prod stack | **PASS** |
| Local Kubernetes (k3d) | **PASS** |

## Known prototype limits

- Workflow canvas pipeline preview on /workflows is decorative (not live run state).
- Agents and Builder pages are informational — no live CRUD yet.
- SearXNG/Firecrawl/Langfuse are Compose placeholders — not real integrations.
- Cloud deploy page is a plan preview — AWS/GCP (Phase 6) not built.
- Reticle GUI is for manual eval import; loop uses headless mirrors (eval:agent, eval:llm).

## Reticle

- `npm run eval:agent` / `npm run eval:llm`
- JSON: `.cursor/eval-reports/functional-audit-20260710-184019.json`

