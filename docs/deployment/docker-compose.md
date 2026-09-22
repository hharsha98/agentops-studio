# Docker Compose deployment (free-stack)

This is the primary demo and development path. No paid cloud account is required.

## Services

| Service | Port | Role |
|---|---|---|
| `web` | 3000 | Next.js UI |
| `api` | 8000 | FastAPI orchestration / RAG / MCP / traces |
| `postgres` | 5432 | pgvector image (available for future persistence) |
| `redis` | 6379 | Available for future job/cache wiring |
| `searxng` | 8080 | Optional (`--profile research`) web search backend |

## Run

```bash
cp .env.example .env
docker compose up
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
