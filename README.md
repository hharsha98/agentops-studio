# AgentOps Studio

**AgentOps Studio** is a portable multi-agent **operations lab** — orchestration, RAG with citations, an MCP-style tool registry, run traces, and optional Docker Compose / Kubernetes scaffolding.

It is **not** Agent Fleet.

| | AgentOps Studio (this repo) | Agent Fleet (separate product) |
|---|---|---|
| Role | Studio / scaffold / hiring-manager demo lab | Live multi-agent ops product |
| Repo | [hharsha98/agentops-studio](https://github.com/hharsha98/agentops-studio) | [hharsha98/agentfleet](https://github.com/hharsha98/agentfleet) |
| Demo | Native Node + Python. Public target `https://agentops.169.58.185.43.sslip.io/` (web :3010, API :8010). Compose optional. | Contabo deployment at `https://agentfleet.169.58.185.43.sslip.io/` (ports 8000/3002) |
| Naming on CV / [Agentic Systems Studio](https://agentic-systems-studio.com/) | AgentOps Studio | Agent Fleet |

Do **not** present third-party hosts (for example `agentfleet.pages.dev`) as owned by this project.

## What works today (demoable)

- Multi-agent **orchestration** with specialist agents and approval gates
- **RAG** over seeded `demo-data/knowledge` markdown (TF-IDF retrieval + citations)
- **MCP-style tool registry** (`knowledge_search`, `web_search`, sandbox Slack/Gmail/GitHub)
- **Run traces** (spans for orchestrator / agents / tools / RAG / approvals)
- Next.js UI wired to the API: Dashboard, Workflows, Runs, Knowledge, MCP, Traces
- `DEMO_PUBLIC` seeds an approval run and a finished run (with citations and traces) at API startup
- Pytest, `scripts/smoke.sh` (dev), and `scripts/smoke-public.sh` (prod ports) — **no Docker**
- Optional Compose / k8s / Terraform scaffolding for machines that have those tools

## Public demo (Contabo) — native production, no Docker

Ports are chosen so this app does not collide with Agent Fleet (`8000`/`3002`) or the RAG demo (`8402`).

```bash
bash scripts/prod-api.sh       # 0.0.0.0:8010  (no reload, one worker)
bash scripts/prod-web.sh       # 0.0.0.0:3010  (next start, same-origin /api)
bash scripts/smoke-public.sh
```

Caddy should serve `https://agentops.169.58.185.43.sslip.io/` and forward `/api/*` to port 8010. systemd units and the site snippet: [docs/deployment/contabo.md](docs/deployment/contabo.md) and [HANDOFF.md](HANDOFF.md).

Open `/dashboard`, approve the seeded executive brief, then check Runs, Knowledge, MCP, and Traces.

## Quick demo (local hot reload) — native, no Docker required

Prerequisites: Node.js 22+, npm 10+, Python 3.12+ (with `python3-venv` / `ensurepip` available).

```bash
cp .env.example .env
npm install

# Terminal 1 — API
bash scripts/dev-api.sh      # starts API on :8000

# Terminal 2 — Web
npm run dev:web              # starts web on :3000
```

Or run the API manually:

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
DEMO_DATA_DIR=../../demo-data uvicorn app.main:app --reload --port 8000
```

The dev API also seeds showcase runs. The browser talks to same-origin `/api`, which the Next server proxies to `http://127.0.0.1:8000`.

Then:

1. Open http://localhost:3000/dashboard  
2. Approve the seeded executive brief, or click **Start multi-agent run**  
3. Inspect **Runs**, **Knowledge**, **MCP**, and **Traces**

Screenshots from this path: [docs/screenshots](docs/screenshots).

Smoke + tests (API must be running for smoke):

```bash
bash scripts/smoke.sh
npm run test:api             # uses apps/api/.venv via scripts/test-api.sh
```

## Optional — Docker Compose (Mac / local Docker only)

Compose is **optional scaffolding**. It is useful when Docker Desktop is available on your Mac; it is **not** required to demo or verify this repo (CI / Cursor cloud VMs often have no Docker).

```bash
cp .env.example .env
docker compose up
```

Optional add-ons:

```bash
docker compose --profile infra up      # Postgres/pgvector + Redis
docker compose --profile research up   # SearXNG
```

See [docs/deployment/docker-compose.md](docs/deployment/docker-compose.md).

## Product story

AgentOps Studio is the place to **show the architecture** of multi-agent ops:

1. Pick a business workflow (executive brief, support triage, product research, compliance).
2. The orchestrator routes specialist agents.
3. Knowledge Analyst retrieves cited chunks; Deep Research can call SearXNG (or a demo fallback).
4. Tool Operator prepares sandbox drafts only — public demo never sends real mail/Slack/GitHub writes.
5. Every step is recorded as a trace span for debugging and portfolio evidence.

Agent Fleet remains the fuller fleets-at-scale product with its own live Contabo demo. Studio complements Fleet; it does not duplicate or rebrand it.

## Deployment (free-stack first)

1. **Contabo public demo** — native prod scripts, Caddy, systemd: [docs/deployment/contabo.md](docs/deployment/contabo.md).
2. **Native local hot reload** — `scripts/dev-api.sh` and `npm run dev:web`.
3. Optional Compose on a machine that has Docker (host ports 3010/8010).
4. Optional k3d practice: [infra/k8s/local/README.md](infra/k8s/local/README.md). Cluster-internal ports stay 3000/8000.
5. Optional Terraform blueprint READMEs: [infra/terraform/aws](infra/terraform/aws), [infra/terraform/gcp](infra/terraform/gcp). No `.tf` files yet.

No Cloudflare paid plan / R2 is required.

## Architecture

See [docs/architecture/overview.md](docs/architecture/overview.md).

## Learning log

`learning/engineering-troubleshooting-log.md` records engineering incidents while building this project.
