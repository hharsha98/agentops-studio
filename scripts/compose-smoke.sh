#!/usr/bin/env bash
# Smoke-test the Docker Compose stack (api + worker + postgres + redis).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

API_URL="${COMPOSE_API_URL:-http://localhost:8000}"
TIMEOUT_SEC="${COMPOSE_SMOKE_TIMEOUT:-180}"

echo "=== Compose smoke (api + worker + postgres + redis) ==="

cleanup() {
  docker compose stop api worker web >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker compose up -d --build postgres redis api worker

deadline=$((SECONDS + TIMEOUT_SEC))
until curl -sf "${API_URL}/ready" >/dev/null 2>&1; do
  if (( SECONDS >= deadline )); then
    echo "Timed out waiting for API ${API_URL}/ready"
    docker compose logs api --tail 40 || true
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
  docker compose logs worker --tail 40 || true
  exit 1
fi

if [[ "${status}" == "failed" ]]; then
  echo "Worker job failed"
  exit 1
fi

echo "=== Compose smoke passed (job_status=${status}) ==="
