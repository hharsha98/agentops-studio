#!/usr/bin/env bash
# Smoke-test the Docker Compose stack (api + worker + postgres + redis).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

API_URL="${COMPOSE_API_URL:-http://localhost:8010}"
WEB_URL="${COMPOSE_WEB_URL:-http://localhost:3011}"
COMPOSE_FILES="-f docker-compose.yml -f docker-compose.smoke.yml"
TIMEOUT_SEC="${COMPOSE_SMOKE_TIMEOUT:-180}"

echo "=== Compose smoke (api + worker + postgres + redis) ==="

cleanup() {
  docker compose $COMPOSE_FILES stop api worker web >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker compose $COMPOSE_FILES up -d --build postgres redis api worker

deadline=$((SECONDS + TIMEOUT_SEC))
until curl -sf "${API_URL}/ready" >/dev/null 2>&1; do
  if (( SECONDS >= deadline )); then
    echo "Timed out waiting for API ${API_URL}/ready"
    docker compose $COMPOSE_FILES logs api --tail 40 || true
    exit 1
  fi
  sleep 2
done

echo "API ready: $(curl -sf "${API_URL}/ready")"

replay="$(curl -sf -X POST "${API_URL}/runs/replay" \
  -H 'Content-Type: application/json' \
  -d '{"workflow_id":"support-triage","goal":"Compose smoke worker path"}')"
run_id="$(python3 -c 'import json,sys; print(json.loads(sys.argv[1])["id"])' "$replay")"
echo "Created replay run: ${run_id}"

job="$(curl -sf -X POST "${API_URL}/runs/${run_id}/jobs")"
job_id="$(python3 -c 'import json,sys; print(json.loads(sys.argv[1])["id"])' "$job")"
echo "Queued worker job: ${job_id}"

terminal=0
while (( SECONDS < deadline )); do
  status="$(curl -sf "${API_URL}/jobs/${job_id}" | python3 -c 'import json,sys; print(json.loads(sys.stdin.read())["status"])')"
  echo "  job status: ${status}"
  case "${status}" in
    waiting_for_approval|completed|failed)
      terminal=1
      break
      ;;
  esac
  sleep 1
done

if [[ "${terminal}" -ne 1 ]]; then
  echo "Worker job did not reach terminal state in time"
  docker compose $COMPOSE_FILES logs worker --tail 40 || true
  exit 1
fi

if [[ "${status}" == "failed" ]]; then
  echo "Worker job failed"
  exit 1
fi

echo "=== Compose smoke passed (job_status=${status}) ==="

if [[ "${COMPOSE_SMOKE_WEB:-1}" == "1" ]]; then
  echo "Starting production web container..."
  docker compose $COMPOSE_FILES up -d --build web
  web_ok=0
  for _ in $(seq 1 60); do
    if python3 -c "import urllib.request; urllib.request.urlopen('${WEB_URL}/', timeout=2)" 2>/dev/null; then
      echo "Web OK on ${WEB_URL}"
      web_ok=1
      break
    fi
    sleep 2
  done
  if [[ "${web_ok}" -ne 1 ]]; then
    echo "Production web did not become ready at ${WEB_URL}"
    docker compose $COMPOSE_FILES logs web --tail 40 || true
    exit 1
  fi
fi
