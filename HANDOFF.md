# HANDOFF — AgentOps Studio demo completion

## What works

- **Multi-agent orchestration** — `POST /runs` executes specialist agent workflows (orchestrator → knowledge → research → compliance → tools).
- **RAG + citations** — seeded markdown in `demo-data/knowledge/` indexed at API startup; `POST /knowledge/query` and in-run citations.
- **MCP-style tools** — registry with `knowledge_search`, `web_search`, `run_status`, sandbox Slack/Gmail/GitHub.
- **Observability** — internal trace spans on `/traces` and per-run detail.
- **UI ↔ API** — Dashboard demo console, Workflows, Runs (Kanban), Knowledge, MCP, Traces.
- **Native verification** — `bash scripts/smoke.sh` + `npm run test:api` (`scripts/test-api.sh` uses `apps/api/.venv`). **No Docker required.**

## How to demo (hiring manager) — native path

```bash
cp .env.example .env
npm install
bash scripts/dev-api.sh          # :8000 (needs python3-venv)
npm run dev:web                  # :3000
```

1. Open http://localhost:3000/dashboard  
2. Click **Start multi-agent run** (Executive daily brief)  
3. Inspect citations + artifact; approve the sandbox Slack action  
4. Open **Runs**, **Traces**, **Knowledge**, **MCP**

### Re-verified after PR #2 (Cursor cloud VM, no Docker) — 2026-09-22

| Feature | Result | Evidence |
|---|---|---|
| Orchestration / Start multi-agent run from Dashboard | **PASS** | UI start → `approval` with steps + citations; approve → `done` |
| Workflows | **PASS** | `/workflows` API + UI lists 4 workflows; Run starts a run |
| Runs history | **PASS** | Kanban lanes from `/runs`; completed runs in `done` |
| Knowledge / RAG citations | **PASS** | 4 docs / 5 chunks; query `refund policy` hits Support Policy |
| MCP tools page + execution | **PASS** | 6 tools listed; `knowledge_search` invoke returns hits |
| Traces / observability | **PASS** | ≥9 spans per executive brief; Traces page lists live spans |
| API health endpoints | **PASS** | `/health` + `/platform` (`product=studio`) |
| UI↔API wiring on each nav route | **PASS** | Dashboard/Workflows/Runs/Knowledge/MCP/Traces live; Deploy is static scaffolding (N/A for API) |
| Distinction from Agent Fleet | **PASS** | README/HANDOFF/landing/`/platform.complements` — Studio ≠ Contabo Fleet |

Commands:

- `bash scripts/smoke.sh` — health, platform Fleet distinction, executive brief → approve, traces, RAG, MCP list+invoke
- `npm run test:api` — 6 passed (venv-aware)

## Optional Compose (Mac / local Docker only)

```bash
docker compose up
```

Not required for “done”. Compose / k8s / Terraform remain optional scaffolding.

## Product positioning

| Product | Role |
|---|---|
| **AgentOps Studio** (this repo) | Portable ops lab / scaffold — native-first demo |
| **Agent Fleet** | Separate Contabo-hosted product — do not conflate |

## Gaps (honest)

- Orchestration is deterministic studio mode (no paid LLM required); live model gateway is env-ready only.
- RAG is TF-IDF over chunks (not pgvector embeddings yet); Postgres/pgvector is optional Compose profile.
- MCP is an in-process registry, not remote MCP servers.
- Langfuse / Firecrawl are not running services (internal traces cover the demo).
- Terraform is README blueprints only (no `.tf` yet).
- Some secondary UI routes (builder/benchmarks/research) remain thin shells.
- Deploy page is docs/scaffolding copy, not a live provisioner.

## Fixes in follow-up verification PR

- `npm run test:api` previously used system `python3` (no pytest) — now `scripts/test-api.sh` + venv.
- Smoke asserts approval, MCP invoke, and Studio≠Fleet platform fields.
- Deploy UI no longer claims LangGraph or that Docker is the hiring-manager path.

## Screenshots

Native demo (no Docker):

| | |
|---|---|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Traces](docs/screenshots/traces.png) |
| ![Knowledge](docs/screenshots/knowledge.png) | ![MCP](docs/screenshots/mcp.png) |
