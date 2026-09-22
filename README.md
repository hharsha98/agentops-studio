# AgentOps Studio

**AgentOps Studio** is a portable multi-agent **operations lab** — orchestration, RAG with citations, an MCP-style tool registry, run traces, and Docker Compose / Kubernetes scaffolding you can demo locally.

It is **not** Agent Fleet.

| | AgentOps Studio (this repo) | Agent Fleet (separate product) |
|---|---|---|
| Role | Studio / scaffold / hiring-manager demo lab | Live multi-agent ops product |
| Repo | [hharsha98/agentops-studio](https://github.com/hharsha98/agentops-studio) | [hharsha98/agentfleet](https://github.com/hharsha98/agentfleet) |
| Demo | `docker compose up` on your machine | Contabo deployment at `https://agentfleet.169.58.185.43.sslip.io/` |
| Naming on CV / [Agentic Systems Studio](https://agentic-systems-studio.com/) | AgentOps Studio | Agent Fleet |

Do **not** present third-party hosts (for example `agentfleet.pages.dev`) as owned by this project.

## What works today (demoable)

- Multi-agent **DAG orchestration** with specialist agents and approval gates
- **RAG** over seeded `demo-data/knowledge` markdown (TF-IDF retrieval + citations)
- **MCP-style tool registry** (`knowledge_search`, `web_search`, sandbox Slack/Gmail/GitHub)
- **Run traces** (spans for orchestrator / agents / tools / RAG / approvals)
- Next.js UI wired to the API: Dashboard, Workflows, Runs, Knowledge, MCP, Traces
- Docker Compose path for web + API + Postgres + Redis (SearXNG optional profile)
- Pytest coverage for health, platform, RAG, MCP, and an end-to-end run

## Quick demo (hiring manager path)

### Option A — Docker Compose (recommended)

```bash
cp .env.example .env
docker compose up
```

- Web: http://localhost:3000/dashboard  
- API: http://localhost:8000/health  
- Open **Dashboard → Start multi-agent run** (Executive daily brief)  
- Inspect **Runs**, **Knowledge**, **MCP**, and **Traces**

Optional SearXNG research backend:

```bash
docker compose --profile research up
```

### Option B — Local processes

```bash
cp .env.example .env
npm install

# API
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
DEMO_DATA_DIR=../../demo-data uvicorn app.main:app --reload --port 8000

# Web (other terminal)
npm run dev:web
```

Smoke the API:

```bash
npm run smoke
# or: bash scripts/smoke.sh
```

API tests:

```bash
npm run test:api
```

## Product story

AgentOps Studio is the place to **show the architecture** of multi-agent ops:

1. Pick a business workflow (executive brief, support triage, product research, compliance).
2. The orchestrator routes specialist agents.
3. Knowledge Analyst retrieves cited chunks; Deep Research can call SearXNG (or a demo fallback).
4. Tool Operator prepares sandbox drafts only — public demo never sends real mail/Slack/GitHub writes.
5. Every step is recorded as a trace span for debugging and portfolio evidence.

Agent Fleet remains the fuller fleets-at-scale product with its own live Contabo demo. Studio complements Fleet; it does not duplicate or rebrand it.

## Deployment (free-stack first)

See [docs/deployment/docker-compose.md](docs/deployment/docker-compose.md) for Compose runbooks.

Optional (already scaffolded, not required for the demo):

- Local Kubernetes: [infra/k8s/local/README.md](infra/k8s/local/README.md)
- Terraform blueprints (docs only): [infra/terraform/aws](infra/terraform/aws), [infra/terraform/gcp](infra/terraform/gcp)

No Cloudflare paid plan / R2 is required.

## Architecture

See [docs/architecture/overview.md](docs/architecture/overview.md).

## Learning log

`learning/engineering-troubleshooting-log.md` records engineering incidents while building this project.
