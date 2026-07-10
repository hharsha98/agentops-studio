# Architecture Overview

AgentOps Studio is split into clear units:

- `apps/web`: Next.js product website and dashboard.
- `apps/api`: FastAPI backend for platform APIs.
- `infra/k8s`: Kubernetes manifests shared across local and managed deployment paths.
- `infra/terraform/aws`: provider-specific managed Kubernetes infrastructure plan.
- `infra/terraform/gcp`: provider-specific managed Kubernetes infrastructure plan.
- `learning`: engineering troubleshooting log.
- `demo-data`: replay data and synthetic workflow fixtures.

## Planned Runtime Flow

1. User chooses a business workflow.
2. Frontend starts a run through the API.
3. The API persists a worker job in Postgres and sends only its job ID to Redis.
4. A separate worker atomically claims the job and advances the multi-agent run.
5. Agents retrieve company knowledge, research the web, and call approved tools.
6. Outputs are stored as artifacts with citations and traces.
7. Human approval pauses worker execution before private external actions.
8. Duplicate Redis deliveries are ignored after the database claim succeeds once.
9. Public demo users only see replay and simulated actions.
