#!/usr/bin/env bash
# Build local Docker images for Compose and k3d.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Building agentops-api:local ==="
docker build -f apps/api/Dockerfile -t agentops-api:local .

echo "=== Building agentops-web:local ==="
docker build -f apps/web/Dockerfile -t agentops-web:local \
  --build-arg NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-http://localhost:8000}" .

echo "=== Images ready ==="
docker images --format '{{.Repository}}:{{.Tag}}' | grep -E '^agentops-(api|web):local$' || true
