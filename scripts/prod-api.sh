#!/usr/bin/env bash
# Production API for the public demo. No reload. One worker (in-memory runs).
# Binds 0.0.0.0:8010 so it does not take Agent Fleet :8000 or the RAG demo :8402.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/apps/api"

if [[ ! -d .venv ]]; then
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate
pip install -e '.[dev]' -q

PORT="${PORT:-8010}"
export DEMO_DATA_DIR="${DEMO_DATA_DIR:-$ROOT/demo-data}"
export PUBLIC_DEMO_MODE="${PUBLIC_DEMO_MODE:-true}"
export DEMO_PUBLIC="${DEMO_PUBLIC:-true}"
export FORCE_DETERMINISTIC="${FORCE_DETERMINISTIC:-true}"

echo "AgentOps API on 0.0.0.0:${PORT} (DEMO_PUBLIC=${DEMO_PUBLIC}, single worker)"
exec uvicorn app.main:app \
  --host 0.0.0.0 \
  --port "$PORT" \
  --workers 1 \
  --proxy-headers \
  --forwarded-allow-ips=127.0.0.1
