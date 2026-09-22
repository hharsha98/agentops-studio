# Docker Compose deployment (optional free-stack)

Compose is **optional scaffolding** for machines with Docker Desktop. The primary hiring-manager demo path is native Node + Python (`bash scripts/dev-api.sh` + `npm run dev:web`) — no Docker required.

## Services

| Service | Host port | Container port | Role |
|---|---|---|---|
| `web` | 3010 | 3000 | Next.js UI (`/api` proxied to the API container) |
| `api` | 8010 | 8000 | FastAPI orchestration / RAG / MCP / traces |
| `postgres` | 5432 | Optional (`--profile infra`) pgvector image for future persistence |
| `redis` | 6379 | Optional (`--profile infra`) |
| `searxng` | 8080 | Optional (`--profile research`) web search backend |

## Run

```bash
cp .env.example .env
docker compose up
```

Default Compose starts **web + api only** — useful when you prefer containers; the same demo also works natively without Docker.

Optional add-ons:

```bash
docker compose --profile infra --profile research up
```

Host ports are **3010** and **8010** so Compose on the Contabo VM does not take Agent Fleet’s 8000/3002. The Contabo public path itself is native — see [contabo.md](contabo.md).

Verify:

```bash
curl -s http://127.0.0.1:8010/health
API_BASE=http://127.0.0.1:8010 bash scripts/smoke.sh
```

Open http://localhost:3010/dashboard. A seeded executive brief is waiting for approval.

## Optional SearXNG

```bash
docker compose --profile research up
```

Without SearXNG, `web_search` returns a deterministic demo fallback so the hiring-manager path still works.

## Production-ish images (optional)

Dockerfiles exist at:

- `apps/api/Dockerfile`
- `apps/web/Dockerfile`

Build examples:

```bash
docker build -f apps/api/Dockerfile -t agentops-api:local .
docker build -f apps/web/Dockerfile -t agentops-web:local .
```

## What is intentionally out of scope for free-stack

- Cloudflare paid Workers / R2
- Managed Langfuse cloud
- Real Gmail / Slack / GitHub writes in public demo mode

## Next steps after Compose

1. Practice Kubernetes with k3d — see `infra/k8s/local/README.md`
2. Review Terraform blueprint READMEs under `infra/terraform/` (docs only today)
