#!/usr/bin/env bash
# Local Kubernetes smoke — requires k3d cluster + host Postgres/Redis (via Compose).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CLUSTER="${K3D_CLUSTER:-agentops-studio}"
NAMESPACE="agentops-studio"
TIMEOUT_SEC="${K8S_SMOKE_TIMEOUT:-300}"

if ! command -v k3d >/dev/null 2>&1; then
  echo "k3d not installed — skip local Kubernetes smoke (install: brew install k3d)"
  exit 0
fi

if ! command -v kubectl >/dev/null 2>&1; then
  echo "kubectl not found — skip k8s smoke"
  exit 0
fi

echo "=== Local k8s smoke (cluster=${CLUSTER}) ==="

bash scripts/build-images.sh

if ! k3d cluster list | grep -q "${CLUSTER}"; then
  echo "Creating k3d cluster ${CLUSTER}..."
  k3d cluster create "${CLUSTER}" --port "3011:80@loadbalancer" --agents 1
fi

k3d image import agentops-api:local agentops-web:local -c "${CLUSTER}"

echo "Ensuring host Postgres + Redis via Compose..."
docker compose up -d postgres redis
for _ in $(seq 1 30); do
  docker compose exec -T postgres pg_isready -U agentops -d agentops >/dev/null 2>&1 && break
  sleep 2
done

kubectl apply -f infra/k8s/base/namespace.yaml

kubectl create secret generic agentops-secrets \
  --namespace "${NAMESPACE}" \
  --from-literal=database-url="postgresql+psycopg://agentops:agentops@host.k3d.internal:5432/agentops" \
  --from-literal=redis-url="redis://host.k3d.internal:6379/0" \
  --from-literal=model-base-url="http://host.k3d.internal:3001/v1" \
  --from-literal=model-api-key="freellmapi-local-smoke" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl apply -f infra/k8s/base/

deadline=$((SECONDS + TIMEOUT_SEC))
until kubectl get pods -n "${NAMESPACE}" -o jsonpath='{.items[*].status.phase}' 2>/dev/null | grep -q Running; do
  if (( SECONDS >= deadline )); then
    kubectl get pods -n "${NAMESPACE}"
    exit 1
  fi
  sleep 3
done

kubectl wait --for=condition=ready pod -l app=agentops-api -n "${NAMESPACE}" --timeout="${TIMEOUT_SEC}s"
kubectl wait --for=condition=ready pod -l app=agentops-web -n "${NAMESPACE}" --timeout="${TIMEOUT_SEC}s" || true

API_POD="$(kubectl get pod -n "${NAMESPACE}" -l app=agentops-api -o jsonpath='{.items[0].metadata.name}')"
READY="$(kubectl exec -n "${NAMESPACE}" "${API_POD}" -- python -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8000/ready').read().decode())")"
echo "API /ready: ${READY}"

echo "=== Local k8s smoke passed ==="
