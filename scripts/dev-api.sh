#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/apps/api"

if [[ ! -d .venv ]]; then
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate
pip install -e '.[dev]' -q

export DEMO_DATA_DIR="${DEMO_DATA_DIR:-$ROOT/demo-data}"
export PUBLIC_DEMO_MODE="${PUBLIC_DEMO_MODE:-true}"
export DEMO_PUBLIC="${DEMO_PUBLIC:-true}"
export FORCE_DETERMINISTIC="${FORCE_DETERMINISTIC:-true}"

# Dev hot-reload stays on :8000. Contabo/public prod is scripts/prod-api.sh (:8010).
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --reload
