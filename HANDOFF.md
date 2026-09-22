# HANDOFF — AgentOps Studio demo completion

## What works

- **Multi-agent orchestration** — `POST /runs` executes specialist agent DAGs (orchestrator → knowledge → research → compliance → tools).
- **RAG + citations** — seeded markdown in `demo-data/knowledge/` indexed at API startup; `POST /knowledge/query` and in-run citations.
- **MCP-style tools** — registry with `knowledge_search`, `web_search`, `run_status`, sandbox Slack/Gmail/GitHub.
- **Observability** — internal trace spans on `/traces` and per-run detail.
- **UI ↔ API** — Dashboard demo console, Workflows, Runs (Kanban), Knowledge, MCP, Traces.
- **Tests** — `npm run test:api` (6 pytest cases) and `scripts/smoke.sh`.

## How to demo (hiring manager)

```bash
cp .env.example .env
docker compose up
```

1. Open http://localhost:3000/dashboard  
2. Click **Start multi-agent run** (Executive daily brief)  
3. Inspect citations + artifact; approve the sandbox Slack action  
4. Open **Runs**, **Traces**, **Knowledge**, **MCP**

Without Docker:

```bash
# terminal 1
cd apps/api && python3 -m venv .venv && source .venv/bin/activate
pip install -e '.[dev]'
DEMO_DATA_DIR=../../demo-data uvicorn app.main:app --reload --port 8000

# terminal 2
npm install && npm run dev:web
```

## Product positioning

| Product | Role |
|---|---|
| **AgentOps Studio** (this repo) | Portable ops lab / scaffold — Compose-first demo |
| **Agent Fleet** | Separate Contabo-hosted product — do not conflate |

## Gaps (honest)

- Orchestration is deterministic studio mode (no paid LLM required); live model gateway is optional/env-ready only.
- RAG is TF-IDF over chunks (not pgvector embeddings yet); Postgres/pgvector is in Compose for a future upgrade.
- MCP is an in-process registry, not remote MCP servers.
- Langfuse / Firecrawl are not running services (internal traces replace Langfuse for the demo).
- Terraform is README blueprints only (no `.tf` yet).
- K8s manifests reference local images; Dockerfiles now exist but managed-cluster deploy is not the primary path.

## Screenshots

Add after local Compose verification (dashboard run, traces, knowledge).
