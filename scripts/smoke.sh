#!/usr/bin/env bash
set -euo pipefail

API_BASE="${NEXT_PUBLIC_API_BASE_URL:-http://localhost:8000}"

echo "==> Health"
curl -fsS "$API_BASE/health" | tee /tmp/agentops-health.json
echo

echo "==> Platform"
PLATFORM_JSON=$(curl -fsS "$API_BASE/platform" | tee /tmp/agentops-platform.json)
echo
python3 -c '
import json,sys
p=json.load(sys.stdin)
assert p["product"]=="studio", p
assert "Agent Fleet" in p["complements"], p
assert "Contabo" in p["complements"], p
assert p["name"]=="AgentOps Studio", p
print("platform product=studio; Fleet/Contabo distinction OK")
' <<<"$PLATFORM_JSON"

echo "==> Start executive daily brief"
RUN_JSON=$(curl -fsS -X POST "$API_BASE/runs" \
  -H 'Content-Type: application/json' \
  -d '{"workflow_id":"executive-daily-brief"}')
echo "$RUN_JSON" | tee /tmp/agentops-run.json
RUN_ID=$(python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])' <<<"$RUN_JSON")
python3 -c '
import json,sys
r=json.load(sys.stdin)
assert r["status"]=="approval", r["status"]
assert r["artifact"], "missing artifact"
assert len(r["citations"])>=1, r
assert len(r["steps"])>=4, r
print("run", r["id"][:8], "approval with", len(r["citations"]), "citations")
' <<<"$RUN_JSON"

echo "==> Traces for $RUN_ID"
TRACES_JSON=$(curl -fsS "$API_BASE/traces?run_id=$RUN_ID" | tee /tmp/agentops-traces.json)
echo
python3 -c '
import json,sys
t=json.load(sys.stdin)
assert t["count"]>=5, t
print("spans=", t["count"], sep="")
' <<<"$TRACES_JSON"

echo "==> Approve sandbox action"
APPROVED=$(curl -fsS -X POST "$API_BASE/runs/$RUN_ID/approve")
echo "$APPROVED" | tee /tmp/agentops-approved.json
python3 -c '
import json,sys
r=json.load(sys.stdin)
assert r["status"]=="done", r["status"]
print("approved →", r["status"])
' <<<"$APPROVED"

echo "==> Knowledge query"
RAG_JSON=$(curl -fsS -X POST "$API_BASE/knowledge/query" \
  -H 'Content-Type: application/json' \
  -d '{"query":"refund policy","top_k":2}' | tee /tmp/agentops-rag.json)
echo
python3 -c '
import json,sys
h=json.load(sys.stdin)["hits"]
assert len(h)>=1
text=h[0]["text"].lower()
assert "refund" in text, h[0]
assert h[0]["title"].lower().find("support") >= 0 or "policy" in h[0]["title"].lower(), h[0]
print("rag hits=", len(h), " top=", h[0]["title"], sep="")
' <<<"$RAG_JSON"

echo "==> MCP tools list + invoke"
MCP_JSON=$(curl -fsS "$API_BASE/mcp/tools" | tee /tmp/agentops-mcp.json)
echo
python3 -c '
import json,sys
names={t["name"] for t in json.load(sys.stdin)["tools"]}
assert "knowledge_search" in names and "web_search" in names, names
print("mcp tools=", len(names), sep="")
' <<<"$MCP_JSON"

INVOKE_JSON=$(curl -fsS -X POST "$API_BASE/mcp/tools/knowledge_search/invoke" \
  -H 'Content-Type: application/json' \
  -d '{"arguments":{"query":"executive brief","top_k":2}}' | tee /tmp/agentops-mcp-invoke.json)
echo
python3 -c '
import json,sys
b=json.load(sys.stdin)
assert b["ok"] is True
assert "hits" in b["result"]
print("invoke knowledge_search hits=", len(b["result"]["hits"]), sep="")
' <<<"$INVOKE_JSON"

echo "Smoke OK — run id $RUN_ID"
