# Architecture Overview

AgentOps Studio is split into clear units:

- `apps/web` — Next.js product UI and live demo console (wired to the API)
- `apps/api` — FastAPI backend: orchestration, RAG, MCP tools, traces
- `demo-data` — seeded knowledge docs and workflow demo metadata
- `infra/k8s` — Kubernetes manifests for local / managed practice
- `infra/terraform/*` — provider-specific blueprint READMEs (not required for demo)
- `learning` — engineering troubleshooting log

## Runtime flow (implemented)

1. With `DEMO_PUBLIC=true` (default), startup executes a finished product-research run and an executive brief sitting in `approval`. Those seeded runs stay on templates so boot does not wait on a model. A visitor can also start a workflow from the Dashboard, Workflows, or Builder page.
2. `POST /runs` creates a run and the orchestration engine executes a specialist agent DAG.
3. **Knowledge Analyst** calls `knowledge_search` (MCP) → RAG index over `demo-data/knowledge`.
4. **Deep Research** calls `web_search` → SearXNG when available, otherwise a demo fallback.
5. When `MODEL_API_KEY` is set and `FORCE_DETERMINISTIC` is false, each specialist step is rewritten by OmniRoute (`POST {MODEL_BASE_URL}/chat/completions`, default model `auto`). Citations still come from the retriever. If the gateway fails, the step keeps its template and the run mode is `degraded`.
6. **Compliance / Tool Operator** produce a cited artifact; risky external actions stay sandboxed.
7. Spans are stored for every orchestrator / agent / tool / RAG / model / approval step (`GET /traces`).
8. Workflows with `requires_approval=true` pause in `approval` until `POST /runs/{id}/approve`.
9. Runs live in memory unless `RUN_DB_PATH` points at a SQLite file (the Contabo unit does).

## Studio vs Fleet

- **AgentOps Studio** — portable ops lab. Public demo target `https://agentops.169.58.185.43.sslip.io/` (native Node + Python, web :3010, API :8010). Sandbox actions only.
- **Agent Fleet** — separate product at `https://agentfleet.169.58.185.43.sslip.io/` (host ports 8000/3002). Do not conflate naming, hosts, or ports.

## Honest capability notes

- Operator-started runs call OmniRoute when `MODEL_API_KEY` is set and `FORCE_DETERMINISTIC` is false. Seeded showcase runs stay deterministic. Without a key, every run stays on templates and `/health` reports `llm.probe=not_configured`.
- RAG uses chunked markdown + TF-IDF style scoring. Compose includes Postgres/pgvector as an optional profile; the native path does not require it.
- MCP is an in-process tool registry. Slack/Gmail/GitHub writes stay sandboxed.
- Observability is internal trace spans, including `kind=model` when OmniRoute is called. Langfuse is not required.
- Run history is SQLite only when `RUN_DB_PATH` is set. The API stays a single worker.
