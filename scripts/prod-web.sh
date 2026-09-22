#!/usr/bin/env bash
# Production Next.js server. Binds 0.0.0.0:3010 (Agent Fleet web uses :3002).
# The browser uses same-origin /api. This process proxies that to the API.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

WEB_PORT="${WEB_PORT:-3010}"
API_PORT="${API_PORT:-${PORT:-8010}}"

# Force the client bundle at /api unless the operator opts into another origin.
# NEXT_PUBLIC_* is inlined at build time, so an inherited localhost value must not win.
if [[ -n "${PUBLIC_API_ORIGIN:-}" ]]; then
  export NEXT_PUBLIC_API_URL="$PUBLIC_API_ORIGIN"
  export NEXT_PUBLIC_API_BASE_URL="$PUBLIC_API_ORIGIN"
else
  export NEXT_PUBLIC_API_URL=/api
  export NEXT_PUBLIC_API_BASE_URL=/api
fi
# Pin the server-side proxy to this app's API. An inherited API_PROXY_TARGET
# (for example :8000 from .env.example or Agent Fleet) must not win.
# Set API_PROXY_ORIGIN=http://other-host:port to opt into a different upstream.
if [[ -n "${API_PROXY_ORIGIN:-}" ]]; then
  export API_PROXY_TARGET="$API_PROXY_ORIGIN"
else
  export API_PROXY_TARGET="http://127.0.0.1:${API_PORT}"
fi

if [[ ! -d node_modules ]]; then
  npm install
fi

NEED_BUILD=0
if [[ "${FORCE_WEB_BUILD:-0}" == "1" || ! -f "$ROOT/apps/web/.next/BUILD_ID" ]]; then
  NEED_BUILD=1
fi
if [[ "${SKIP_WEB_BUILD:-0}" == "1" ]]; then
  NEED_BUILD=0
fi
if [[ "$NEED_BUILD" == "1" ]]; then
  echo "Building web with NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}"
  npm run build -w apps/web
fi

echo "AgentOps web on 0.0.0.0:${WEB_PORT} proxying /api → ${API_PROXY_TARGET}"
cd "$ROOT/apps/web"
export NODE_ENV=production
exec npx next start --hostname 0.0.0.0 --port "$WEB_PORT"
