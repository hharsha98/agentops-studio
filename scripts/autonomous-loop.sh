#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== AgentOps autonomous loop cycle ==="

if ! curl -sf http://localhost:8001/ready >/dev/null 2>&1; then
  echo "Starting API on :8001..."
  (
    cd apps/api
    [ -d .venv ] || python3 -m venv .venv
    source .venv/bin/activate
    pip install -q -e ".[dev]"
    uvicorn app.main:app --host 127.0.0.1 --port 8001
  ) &
  for _ in $(seq 1 30); do
    curl -sf http://localhost:8001/ready >/dev/null 2>&1 && break
    sleep 1
  done
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

echo "→ Agent outcome eval"
python3 scripts/agent-outcome-eval.py

echo "→ Docker compose config"
docker compose config -q

echo "=== Cycle complete ==="
