# AgentOps Studio

AgentOps Studio is a multi-agent AI workforce platform for business operations. It is designed around business outcomes, operational visibility, Kubernetes-based deployment, and portability.

## What This Project Demonstrates

- Built locally with Docker and Kubernetes.
- Supports managed Kubernetes deployment through infrastructure-as-code blueprints.
- Portable across providers through reusable application manifests and provider-specific Terraform modules.
- Demonstrates production deployment patterns without locking the product to one vendor.

## Product Vision

AgentOps Studio is an operations command center where teams can run AI workforces for support, sales, marketing, finance, hiring, product research, engineering delivery, compliance, investor updates, and executive briefings.

The first implementation focuses on the product experience and deployment foundation:

- Premium landing page.
- Dashboard workspace.
- Deployment page for Docker, local Kubernetes, managed Kubernetes, and portable infrastructure.
- 30-agent catalog concept.
- 10 business workflow outcomes.
- Docker Compose foundation.
- Local Kubernetes structure.
- Terraform placeholders and deployment docs.
- Learning log for engineering troubleshooting and operational lessons.

## Planned Platform Capabilities

- Streaming multi-agent chat.
- Visual workflow builder.
- Kanban execution board.
- Runtime agent builder.
- Document intelligence with RAG and citations.
- Deep web research with SearXNG and Firecrawl.
- MCP marketplace-style registry.
- Langfuse observability.
- Benchmark scorecard.
- Cost and token tracking.
- Private real actions through GitHub, Gmail, and Slack.

## Local Development

Prerequisites:

- Node.js 22+
- npm 10+
- Python 3.12+
- Docker Desktop
- k3d for local Kubernetes practice

Install JavaScript dependencies:

```bash
npm install
```

Run the web app:

```bash
npm run dev:web
```

Run the API locally after installing Python dependencies:

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

By default, the API uses a local SQLite database file:

```bash
DATABASE_URL=sqlite:///./agentops-studio.db
```

SQLite is a lightweight file database that is useful for simple local development. Docker Compose uses Postgres instead, which is closer to the production database shape used in managed Kubernetes deployments.

Background run execution uses Redis Queue (RQ). Postgres stores the durable job status, Redis delivers job IDs to workers, and a separate worker process advances each run until it reaches human approval, completion, or failure. Redis is a delivery channel, not the source of truth.

Run both with Docker Compose:

```bash
docker compose up --build
```

The Compose stack starts separate `api` and `worker` containers from the same Python image. This mirrors Kubernetes, where the API and worker can scale independently.

## Deployment Strategy

1. Build and test locally with Docker Compose.
2. Practice Kubernetes locally with k3d.
3. Validate the Kubernetes manifests in a local cluster.
4. Deploy to a managed Kubernetes environment when a public demo or production-style validation is needed.
5. Keep provider-specific infrastructure isolated in Terraform so the application remains portable.

The deployment strategy prioritizes portability, cost awareness, observable services, and clean teardown of temporary managed environments.

## Learning Log

The file `learning/engineering-troubleshooting-log.md` records useful engineering incidents while building this project. Each entry explains the symptom, root cause, fix, verification, and the lesson learned.
