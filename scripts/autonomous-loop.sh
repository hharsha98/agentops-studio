#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== AgentOps autonomous loop — local-first delivery (Phases 1–5) ==="
echo "Roadmap: .cursor/ROADMAP.md — AWS/GCP deferred until local Docker + k3d pass"

echo "→ Configure Reticle + local .env from career-ops FreeLLMAPI"
python3 scripts/setup-reticle-keys.py

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

export ENABLE_LIVE_LLM="${ENABLE_LIVE_LLM:-true}"
export MODEL_API_KEY="${MODEL_API_KEY:-}"

if ! curl -sf http://localhost:3001/api/health >/dev/null 2>&1; then
  echo "Starting FreeLLMAPI on :3001..."
  (
    cd "$HOME/dev/freellmapi"
    npm run dev -w server
  ) &
  for _ in $(seq 1 30); do
    curl -sf http://localhost:3001/api/health >/dev/null 2>&1 && break
    sleep 1
  done
fi

if ! redis-cli -u "${REDIS_URL:-redis://localhost:6379/0}" ping >/dev/null 2>&1; then
  echo "Starting Redis on :6379 for worker eval..."
  if docker ps --format '{{.Names}}' | grep -qx agentops-loop-redis; then
    docker start agentops-loop-redis >/dev/null 2>&1 || true
  elif ! redis-cli ping >/dev/null 2>&1; then
    docker run -d --name agentops-loop-redis -p 6379:6379 redis:7-alpine >/dev/null 2>&1 || true
  fi
  for _ in $(seq 1 20); do
    redis-cli ping >/dev/null 2>&1 && break
    sleep 1
  done
fi

need_api_restart=1
if curl -sf http://localhost:8001/ready >/dev/null 2>&1; then
  if python3 -c "import json,urllib.request; b=json.load(urllib.request.urlopen('http://localhost:8001/ready')); raise SystemExit(0 if 'redis' in b.get('checks',{}) else 1)"; then
    need_api_restart=0
  fi
fi

if [[ "${need_api_restart}" -eq 1 ]]; then
  pkill -f "uvicorn app.main:app --host 127.0.0.1 --port 8001" >/dev/null 2>&1 || true
  sleep 1
  echo "Starting API on :8001..."
  (
    cd apps/api
    [ -d .venv ] || python3 -m venv .venv
    source .venv/bin/activate
    pip install -q -e ".[dev]"
    REDIS_URL="${REDIS_URL:-redis://localhost:6379/0}" \
    ENABLE_LIVE_LLM="${ENABLE_LIVE_LLM:-false}" \
    MODEL_API_KEY="${MODEL_API_KEY:-}" \
    MODEL_BASE_URL="${MODEL_BASE_URL:-http://localhost:3001/v1}" \
      uvicorn app.main:app --host 127.0.0.1 --port 8001
  ) &
  for _ in $(seq 1 30); do
    curl -sf http://localhost:8001/ready >/dev/null 2>&1 && break
    sleep 1
  done
fi

if ! pgrep -fl "rq worker.*agentops" >/dev/null 2>&1; then
  echo "Starting RQ worker for agent job eval..."
  (
    cd apps/api
    source .venv/bin/activate
    REDIS_URL="${REDIS_URL:-redis://localhost:6379/0}" \
      rq worker --url "${REDIS_URL:-redis://localhost:6379/0}" agentops
  ) &
  sleep 2
fi

if ! curl -sf http://localhost:3010/ >/dev/null 2>&1; then
  echo "Starting web on :3010..."
  npm run dev:web &
  for _ in $(seq 1 30); do
    curl -sf http://localhost:3010/ >/dev/null 2>&1 && break
    sleep 1
  done
fi

echo "→ API pytest"
cd apps/api && source .venv/bin/activate && pytest -q
cd "$ROOT"

echo "→ Web build"
npm run build:web

echo "→ Playwright E2E"
npm run test:e2e:web

echo "→ Agent outcome eval (Reticle mirror — expanded)"
AGENTOPS_API_BASE=http://localhost:8001 python3 scripts/agent-outcome-eval.py

echo "→ FreeLLMAPI / Reticle LLM eval"
python3 scripts/reticle-freellmapi-eval.py

echo "→ Docker compose config"
docker compose config -q

if [[ "${LOOP_COMPOSE_SMOKE:-1}" == "1" ]]; then
  echo "→ Compose smoke (api + worker + postgres + redis + prod web)"
  chmod +x scripts/compose-smoke.sh
  bash scripts/compose-smoke.sh
else
  echo "→ Compose smoke skipped (LOOP_COMPOSE_SMOKE=0)"
fi

if [[ "${LOOP_K8S_SMOKE:-0}" == "1" ]]; then
  echo "→ Local k3d smoke (optional)"
  chmod +x scripts/k8s-local-smoke.sh
  bash scripts/k8s-local-smoke.sh
else
  echo "→ k8s smoke skipped (set LOOP_K8S_SMOKE=1 to enable)"
fi

python3 - <<'PY'
import json
from datetime import UTC, datetime
from pathlib import Path

status = {
    "updated_at": datetime.now(UTC).isoformat(),
    "current_phase": 2,
    "phase_name": "local_docker_prod",
    "loop_complete": False,
    "note": "Local-first: Compose + LLM + k3d before any AWS/GCP",
}
Path(".cursor/PHASE-STATUS.json").write_text(json.dumps(status, indent=2) + "\n")
PY

echo "=== Cycle complete (delivery loop continues until Phase 5) ==="
