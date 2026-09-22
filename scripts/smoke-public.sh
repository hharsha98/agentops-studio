#!/usr/bin/env bash
# Smoke the production servers (scripts/prod-api.sh + scripts/prod-web.sh).
# Does not start them. Default ports: API 8010, web 3010.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_BASE="${API_BASE:-http://127.0.0.1:8010}"
WEB_BASE="${WEB_BASE:-http://127.0.0.1:3010}"
API_PORT="${API_PORT:-8010}"
WEB_PORT="${WEB_PORT:-3010}"

echo "==> Listening on 0.0.0.0 (or ::) :${API_PORT} and :${WEB_PORT}"
python3 - "$API_PORT" "$WEB_PORT" <<'PY'
import sys
ports = [int(p) for p in sys.argv[1:]]

def listening_wildcard(port: int) -> bool:
    hexport = f"{port:04X}"
    for proc in ("/proc/net/tcp", "/proc/net/tcp6"):
        try:
            lines = open(proc, encoding="utf-8").read().splitlines()[1:]
        except FileNotFoundError:
            continue
        for line in lines:
            parts = line.split()
            local, state = parts[1], parts[3]
            ip, listed = local.rsplit(":", 1)
            if listed.upper() != hexport or state.upper() != "0A":
                continue
            if set(ip) <= {"0"}:
                return True
    return False

missing = [str(port) for port in ports if not listening_wildcard(port)]
if missing:
    raise SystemExit(
        "expected wildcard bind for port(s) "
        + ", ".join(missing)
        + " — start scripts/prod-api.sh and scripts/prod-web.sh"
    )
print("wildcard bind ok", ",".join(str(p) for p in ports))
PY

echo "==> API health ${API_BASE}/health"
HEALTH=$(curl -fsS "$API_BASE/health")
echo "$HEALTH"
python3 -c '
import json,sys
h=json.loads(sys.argv[1])
assert h["status"]=="ok", h
assert h["service"]=="agentops-api", h
assert h["demo_public"] is True, h
assert h["knowledge_documents"]>=4, h
assert h["runs"]>=2, h
print("health demo_public runs=", h["runs"], sep="")
' "$HEALTH"

echo "==> Same-origin proxy ${WEB_BASE}/api/health"
PROXY=$(curl -fsS "$WEB_BASE/api/health")
python3 -c '
import json,sys
h=json.loads(sys.argv[1])
assert h["status"]=="ok" and h["demo_public"] is True, h
print("web /api proxy ok")
' "$PROXY"

echo "==> CORS for the public Studio origin"
CORS_HEADERS=$(curl -sS -D - -o /dev/null \
  -H 'Origin: https://agentops.169.58.185.43.sslip.io' \
  "$API_BASE/health")
python3 -c '
import sys
text=sys.stdin.read().lower()
assert "access-control-allow-origin: https://agentops.169.58.185.43.sslip.io" in text, text
print("cors public origin ok")
' <<<"$CORS_HEADERS"

echo "==> Platform is Studio, not Fleet"
PLATFORM_JSON=$(curl -fsS "$API_BASE/platform")
python3 -c '
import json,sys
p=json.loads(sys.argv[1])
assert p["product"]=="studio", p
assert p["name"]=="AgentOps Studio", p
assert "agentops.169.58.185.43.sslip.io" in p["public_host"], p
assert "agentfleet.169.58.185.43.sslip.io" in p["distinct_from"], p
assert "Agent Fleet" in p["complements"] and "Contabo" in p["complements"], p
assert p["demo_public"] is True
print("platform host split ok")
' "$PLATFORM_JSON"

echo "==> Seeded approval run is present before a new visitor clicks anything"
RUNS_JSON=$(curl -fsS "$API_BASE/runs")
python3 -c '
import json,sys
runs=json.loads(sys.argv[1])["runs"]
seeded=[r for r in runs if r.get("seeded")]
assert any(r["status"]=="approval" and r["citations"] for r in seeded), runs
assert any(r["status"]=="done" and r["citations"] for r in seeded), runs
print("seeded runs", len(seeded))
' "$RUNS_JSON"

echo "==> HTML routes"
python3 - "$WEB_BASE" <<'PY'
import sys, urllib.request
base = sys.argv[1].rstrip("/")
pages = {
    "/": "AgentOps Studio",
    "/dashboard": "Operations command center",
    "/workflows": "Outcome-oriented multi-agent runs",
    "/runs": "Track every agent run",
    "/knowledge": "Company knowledge",
    "/mcp": "MCP registry",
    "/traces": "Trace every prompt",
    "/cloud": "Contabo public demo",
    "/builder": "not part of this demo",
    "/benchmarks": "not running",
    "/research": "not running",
}
for path, needle in pages.items():
    with urllib.request.urlopen(base + path, timeout=20) as response:
        body = response.read().decode("utf-8", "replace")
        status = response.status
    if status != 200:
        raise SystemExit(f"{path} status {status}")
    if needle not in body:
        raise SystemExit(f"{path} missing {needle!r}")
    print(f"200 {path}")
home = urllib.request.urlopen(base + "/", timeout=20).read().decode("utf-8", "replace")
for banned in ("18.4k", "50 benchmarks", "Firecrawl extracts"):
    if banned in home:
        raise SystemExit(f"homepage still claims {banned!r}")
print("homepage claims ok")
PY

if [[ -d "$ROOT/apps/web/.next/static" ]]; then
  echo "==> Production client bundle does not point at localhost:8000"
  if grep -R -q "localhost:8000" "$ROOT/apps/web/.next/static"; then
    echo "client bundle contains localhost:8000 — rebuild with scripts/prod-web.sh" >&2
    exit 1
  fi
  echo "client bundle ok"
fi

echo "==> Start executive daily brief via public API"
RUN_JSON=$(curl -fsS -X POST "$API_BASE/runs" \
  -H 'Content-Type: application/json' \
  -d '{"workflow_id":"executive-daily-brief"}')
python3 -c '
import json,sys
r=json.loads(sys.argv[1])
assert r["status"]=="approval", r["status"]
assert r["artifact"]
assert len(r["citations"])>=1, r
assert len(r["steps"])>=4, r
assert r.get("seeded") is False
print("run", r["id"][:8], "approval citations", len(r["citations"]))
open("/tmp/agentops-public-run-id","w").write(r["id"])
' "$RUN_JSON"
RUN_ID=$(cat /tmp/agentops-public-run-id)

echo "==> Same flow through the web /api proxy"
PROXY_RUN=$(curl -fsS -X POST "$WEB_BASE/api/runs" \
  -H 'Content-Type: application/json' \
  -d '{"workflow_id":"support-triage"}')
python3 -c '
import json,sys
r=json.loads(sys.argv[1])
assert r["status"]=="approval" and r["citations"], r
print("proxy run", r["id"][:8], r["workflow_id"])
' "$PROXY_RUN"

echo "==> Traces for $RUN_ID"
TRACES_JSON=$(curl -fsS "$API_BASE/traces?run_id=$RUN_ID")
python3 -c '
import json,sys
t=json.loads(sys.argv[1])
assert t["count"]>=5, t
print("spans", t["count"])
' "$TRACES_JSON"

echo "==> Approve sandbox action"
APPROVED=$(curl -fsS -X POST "$API_BASE/runs/$RUN_ID/approve")
python3 -c '
import json,sys
r=json.loads(sys.argv[1])
assert r["status"]=="done", r["status"]
print("approved", r["status"])
' "$APPROVED"

echo "==> Knowledge query"
RAG_JSON=$(curl -fsS -X POST "$WEB_BASE/api/knowledge/query" \
  -H 'Content-Type: application/json' \
  -d '{"query":"refund policy","top_k":2}')
python3 -c '
import json,sys
h=json.loads(sys.argv[1])["hits"]
assert h and "refund" in h[0]["text"].lower(), h[0]
print("rag", h[0]["title"])
' "$RAG_JSON"

echo "==> MCP list + invoke through the proxy"
MCP_JSON=$(curl -fsS "$WEB_BASE/api/mcp/tools")
python3 -c '
import json,sys
names={t["name"] for t in json.loads(sys.argv[1])["tools"]}
assert {"knowledge_search","web_search","slack_post"} <= names, names
print("mcp", len(names))
' "$MCP_JSON"
INVOKE_JSON=$(curl -fsS -X POST "$WEB_BASE/api/mcp/tools/knowledge_search/invoke" \
  -H 'Content-Type: application/json' \
  -d '{"arguments":{"query":"executive brief","top_k":2}}')
python3 -c '
import json,sys
b=json.loads(sys.argv[1])
assert b["ok"] is True and b["result"]["hits"], b
print("invoke hits", len(b["result"]["hits"]))
' "$INVOKE_JSON"

echo "Smoke public OK — run id $RUN_ID"
