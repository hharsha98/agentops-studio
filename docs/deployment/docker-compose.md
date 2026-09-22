# Docker Compose deployment (optional free-stack)

Compose is **optional scaffolding** for machines with Docker Desktop. The primary hiring-manager demo path is native Node + Python (`bash scripts/dev-api.sh` + `npm run dev:web`) — no Docker required.

## Services

| Service | Port | Role |
|---|---|---|
| `web` | 3000 | Next.js UI |
| `api` | 8000 | FastAPI orchestration / RAG / MCP / traces |
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

Verify:

```bash
curl -s http://localhost:8000/health
bash scripts/smoke.sh
```

Open http://localhost:3000/dashboard and start **Executive daily brief**.

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
docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 -t agentops-web:local .
```

## What is intentionally out of scope for free-stack

- Cloudflare paid Workers / R2
- Managed Langfuse cloud
- Real Gmail / Slack / GitHub writes in public demo mode

## Next steps after Compose

1. Practice Kubernetes with k3d — see `infra/k8s/local/README.md`
2. Review Terraform blueprint READMEs under `infra/terraform/` (docs only today)
