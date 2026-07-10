# Deploy runbook — Cursor branch

**Worktree:** `/Users/harsha/Documents/AI PROJECTS/projects/agentops-studio-cursor`  
**Branch:** `cursor/ui-deploy-goal`  
**Theme:** Futuristic AI  
**Web port:** `3010` (avoids Codex on `3000`)

## Quick local demo (frontend only)

```bash
cd "/Users/harsha/Documents/AI PROJECTS/projects/agentops-studio-cursor"
npm run dev:web
```

Open http://localhost:3010

Pages with live API data need the backend running (see below).

## Full stack with Docker Compose

```bash
cd "/Users/harsha/Documents/AI PROJECTS/projects/agentops-studio-cursor"
docker compose up --build
```

| Service | URL | Purpose |
|---------|-----|---------|
| Web | http://localhost:3010 | Next.js UI |
| API | http://localhost:8000 | FastAPI backend |
| API health | http://localhost:8000/ready | Readiness probe |
| Postgres | localhost:5432 | Database |
| Redis | localhost:6379 | Job queue |
| SearXNG | http://localhost:8080 | Search placeholder |

## API without Docker

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

In another terminal:

```bash
cd "/Users/harsha/Documents/AI PROJECTS/projects/agentops-studio-cursor"
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev:web
```

## E2E verification

```bash
npm run test:e2e:web
# or: cd apps/web && npm run test:e2e
```

Requires dev server on http://localhost:3010 (`npm run dev:web`).


## Kubernetes (optional local practice)

See `infra/k8s/local/README.md` for k3d setup. Application manifests live in `infra/k8s/base/`.

## Push to GitHub (user approval required)

```bash
git push -u origin cursor/ui-deploy-goal
```

Then open a PR to compare against `main` before merging.
