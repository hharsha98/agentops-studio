# Local Kubernetes (k3d) — no AWS/GCP required

Practice full pod deployment on your Mac **before** any cloud spend.

## Prerequisites

- Docker Desktop
- k3d — `brew install k3d`
- kubectl

## Quick smoke (automated)

```bash
npm run eval:k8s
```

This will build images, create/import into k3d, start host Postgres+Redis via Compose, apply manifests, and verify API `/ready`.

## Manual flow

```bash
docker compose up -d postgres redis
bash scripts/build-images.sh
k3d cluster create agentops-studio --port "3011:80@loadbalancer" --agents 1
k3d image import agentops-api:local agentops-web:local -c agentops-studio
kubectl apply -f infra/k8s/base/namespace.yaml
kubectl create secret generic agentops-secrets \
  --namespace agentops-studio \
  --from-literal=database-url=postgresql+psycopg://agentops:agentops@host.k3d.internal:5432/agentops \
  --from-literal=redis-url=redis://host.k3d.internal:6379/0 \
  --from-literal=model-base-url=http://host.k3d.internal:3001/v1 \
  --from-literal=model-api-key=replace_me
kubectl apply -f infra/k8s/base/
kubectl get pods -n agentops-studio
```

**AWS/GCP are deferred** until local Docker Compose and this k3d flow both pass. See `.cursor/ROADMAP.md` Phase 5.
