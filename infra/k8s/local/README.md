# Local Kubernetes (k3d) — no AWS/GCP required

Practice full pod deployment on your Mac **before** any cloud spend.

## Prerequisites

- Docker Desktop
- k3d — `brew install k3d` (free, local only — **no AWS account**)
- kubectl (bundled with Docker Desktop or k3d context)

## Quick smoke (automated)

```bash
npm run eval:k8s
```

This will:
1. Build `agentops-api:local` and `agentops-web:local`
2. Create k3d cluster `agentops-studio` if missing (load balancer on **localhost:3020**)
3. Start Postgres + Redis via Compose on host ports **5433** / **6380** (`docker-compose.k8s.yml`)
4. Apply `infra/k8s/base/` manifests
5. Wait for API + web + worker pods and verify `/ready` inside the API pod

Include in full loop:

```bash
LOOP_K8S_SMOKE=1 npm run loop
```

## Check cluster status

```bash
kubectl get pods -n agentops-studio
k3d cluster list
```

## Manual flow

```bash
docker compose -f docker-compose.yml -f docker-compose.k8s.yml up -d postgres redis
bash scripts/build-images.sh
k3d cluster create agentops-studio --port "3020:80@loadbalancer" --agents 1
k3d image import agentops-api:local agentops-web:local -c agentops-studio
kubectl apply -f infra/k8s/base/namespace.yaml
kubectl create secret generic agentops-secrets \
  --namespace agentops-studio \
  --from-literal=database-url=postgresql+psycopg://agentops:agentops@host.k3d.internal:5433/agentops \
  --from-literal=redis-url=redis://host.k3d.internal:6380/0 \
  --from-literal=model-base-url=http://host.k3d.internal:3001/v1 \
  --from-literal=model-api-key=replace_me
kubectl apply -f infra/k8s/base/
kubectl get pods -n agentops-studio
```

## Verified on this machine (2026-07-10)

- k3d v5.9.0 installed via Homebrew
- `npm run eval:k8s` passed — API `/ready` returned `database: ok`, `redis: ok`
- Pods: `agentops-api`, `agentops-web`, `agentops-worker` all Running

**Phase 6 (AWS/GCP)** stays deferred until you choose to create cloud accounts.
