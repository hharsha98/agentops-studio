# Architecture Overview

AgentOps Studio is split into clear units:

- `apps/web` — Next.js product UI and live demo console (wired to the API)
- `apps/api` — FastAPI backend: orchestration, RAG, MCP tools, traces
- `demo-data` — seeded knowledge docs and workflow demo metadata
- `infra/k8s` — Kubernetes manifests for local / managed practice
- `infra/terraform/*` — provider-specific blueprint READMEs (not required for demo)
- `learning` — engineering troubleshooting log

## Runtime flow (implemented)

1. With `DEMO_PUBLIC=true` (default), startup already executed a finished product-research run and an executive brief sitting in `approval`. A visitor can also start a workflow from the Dashboard or Workflows page.
2. `POST /runs` creates a run and the orchestration engine executes a specialist agent DAG.
3. **Knowledge Analyst** calls `knowledge_search` (MCP) → RAG index over `demo-data/knowledge`.
4. **Deep Research** calls `web_search` → SearXNG when available, otherwise a demo fallback.
5. **Compliance / Tool Operator** produce a cited artifact; risky external actions stay sandboxed.
6. Spans are stored for every orchestrator / agent / tool / RAG / approval step (`GET /traces`).
7. Workflows with `requires_approval=true` pause in `approval` until `POST /runs/{id}/approve`.

## Studio vs Fleet

- **AgentOps Studio** — portable ops lab. Public demo target `https://agentops.169.58.185.43.sslip.io/` (native Node + Python, web :3010, API :8010). Sandbox actions only.
- **Agent Fleet** — separate product at `https://agentfleet.169.58.185.43.sslip.io/` (host ports 8000/3002). Do not conflate naming, hosts, or ports.

## Honest capability notes

- Orchestration is a deterministic studio DAG runner (no paid LLM required for the demo path).
- RAG uses chunked markdown + TF-IDF style scoring; Compose includes Postgres/pgvector for future vector upgrades.
- MCP is an in-process tool registry with uniform invoke schemas (studio sandbox), not a fleet of remote MCP servers.
- Observability is first-class **internal traces**; Langfuse remains optional future export.
