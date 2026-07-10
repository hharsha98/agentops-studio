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
3. Backend orchestrates agents with LangGraph.
4. Agents retrieve company knowledge, research the web, and call approved tools.
5. Outputs are stored as artifacts with citations and traces.
6. Human approval is required before private external actions.
7. Public demo users only see replay and simulated actions.
