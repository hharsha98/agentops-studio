# Multi-cloud strategy

Prefer the free-stack Compose path first (see [docker-compose.md](./docker-compose.md)).

1. Build and test locally with Docker Compose.
2. Practice Kubernetes locally with k3d using `infra/k8s`.
3. Validate manifests before any managed cluster spend.
4. Keep provider-specific infrastructure isolated in Terraform blueprints under `infra/terraform/`.
5. Tear down temporary managed environments promptly — cost awareness is part of the portfolio story.

AgentOps Studio does **not** require Cloudflare paid services or R2 for the demo path.
