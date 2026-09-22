#!/usr/bin/env bash
set -euo pipefail

API_BASE="${NEXT_PUBLIC_API_BASE_URL:-http://localhost:8000}"

echo "==> Health"
curl -fsS "$API_BASE/health" | tee /tmp/agentops-health.json
echo

echo "==> Platform"
curl -fsS "$API_BASE/platform" | tee /tmp/agentops-platform.json
echo

echo "==> Start executive daily brief"
RUN_JSON=$(curl -fsS -X POST "$API_BASE/runs" \
  -H 'Content-Type: application/json' \
  -d '{"workflow_id":"executive-daily-brief"}')
echo "$RUN_JSON" | tee /tmp/agentops-run.json
RUN_ID=$(python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])' <<<"$RUN_JSON")

echo "==> Traces for $RUN_ID"
curl -fsS "$API_BASE/traces?run_id=$RUN_ID" | tee /tmp/agentops-traces.json
echo

echo "==> Knowledge query"
curl -fsS -X POST "$API_BASE/knowledge/query" \
  -H 'Content-Type: application/json' \
  -d '{"query":"refund policy","top_k":2}' | tee /tmp/agentops-rag.json
echo

echo "==> MCP tools"
curl -fsS "$API_BASE/mcp/tools" | tee /tmp/agentops-mcp.json
echo

echo "Smoke OK — run id $RUN_ID"
