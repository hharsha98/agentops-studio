#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
REPORT_DIR=".cursor/eval-reports"
AUDIT_JSON="${REPORT_DIR}/functional-audit-$(date -u +%Y%m%d-%H%M%S).json"
AUDIT_MD=".cursor/FUNCTIONAL-AUDIT.md"

mkdir -p "$REPORT_DIR"

echo "=== AgentOps full functional audit (local prototype) ==="

python3 scripts/setup-reticle-keys.py

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

export ENABLE_LIVE_LLM="${ENABLE_LIVE_LLM:-true}"
export API_BASE_URL="${API_BASE_URL:-http://localhost:8001}"
export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-http://localhost:8001}"
export AGENTOPS_API_BASE="${AGENTOPS_API_BASE:-http://localhost:8001}"

if ! curl -sf http://localhost:3001/api/health >/dev/null 2>&1; then
  echo "→ Starting FreeLLMAPI :3001"
  (cd "$HOME/dev/freellmapi" && npm run dev -w server) &
  for _ in $(seq 1 40); do curl -sf http://localhost:3001/api/health >/dev/null 2>&1 && break; sleep 1; done
fi

if ! redis-cli ping >/dev/null 2>&1; then
  echo "→ Starting Redis :6379"
  docker start agentops-loop-redis >/dev/null 2>&1 || docker run -d --name agentops-loop-redis -p 6379:6379 redis:7-alpine >/dev/null 2>&1 || true
  for _ in $(seq 1 20); do redis-cli ping >/dev/null 2>&1 && break; sleep 1; done
fi

pkill -f "uvicorn app.main:app --host 127.0.0.1 --port 8001" >/dev/null 2>&1 || true
sleep 1
echo "→ Starting API :8001"
(
  cd apps/api
  source .venv/bin/activate
  REDIS_URL="${REDIS_URL:-redis://localhost:6379/0}" \
  ENABLE_LIVE_LLM="${ENABLE_LIVE_LLM}" \
  MODEL_API_KEY="${MODEL_API_KEY:-}" \
  MODEL_BASE_URL="${MODEL_BASE_URL:-http://localhost:3001/v1}" \
    uvicorn app.main:app --host 127.0.0.1 --port 8001
) &
for _ in $(seq 1 40); do curl -sf http://localhost:8001/ready >/dev/null 2>&1 && break; sleep 1; done

if ! pgrep -fl "rq worker.*agentops" >/dev/null 2>&1; then
  echo "→ Starting RQ worker"
  (
    cd apps/api
    source .venv/bin/activate
    rq worker --url "${REDIS_URL:-redis://localhost:6379/0}" agentops
  ) &
  sleep 2
fi

if ! curl -sf http://localhost:3010/ >/dev/null 2>&1 || [[ "${FORCE_WEB_RESTART:-1}" == "1" ]]; then
  echo "→ Starting web :3010 (API=${API_BASE_URL})"
  pkill -f "next dev" >/dev/null 2>&1 || true
  pkill -f "apps/web" >/dev/null 2>&1 || true
  sleep 2
  API_BASE_URL="$API_BASE_URL" NEXT_PUBLIC_API_BASE_URL="$NEXT_PUBLIC_API_BASE_URL" npm run dev:web &
  for _ in $(seq 1 40); do curl -sf http://localhost:3010/ >/dev/null 2>&1 && break; sleep 1; done
fi

PYTEST_RC=0
(cd apps/api && source .venv/bin/activate && ENABLE_LIVE_LLM=false MODEL_API_KEY= pytest -q) || PYTEST_RC=$?

AGENT_RC=0
AGENTOPS_API_BASE="$AGENTOPS_API_BASE" ENABLE_LIVE_LLM="$ENABLE_LIVE_LLM" python3 scripts/agent-outcome-eval.py || AGENT_RC=$?

LLM_RC=0
python3 scripts/reticle-freellmapi-eval.py || LLM_RC=$?

E2E_SMOKE_RC=0
npm run test:e2e -w apps/web -- e2e/smoke.spec.ts --workers=1 || E2E_SMOKE_RC=$?

E2E_FUNC_RC=0
npm run test:e2e -w apps/web -- e2e/functional.spec.ts --workers=1 || E2E_FUNC_RC=$?

COMPOSE_RC=0
if [[ "${SKIP_COMPOSE_SMOKE:-0}" != "1" ]]; then
  bash scripts/compose-smoke.sh || COMPOSE_RC=$?
fi

K8S_RC=0
if [[ "${SKIP_K8S_SMOKE:-0}" != "1" ]] && command -v k3d >/dev/null 2>&1; then
  bash scripts/k8s-local-smoke.sh || K8S_RC=$?
fi

export PYTEST_RC AGENT_RC LLM_RC E2E_SMOKE_RC E2E_FUNC_RC COMPOSE_RC K8S_RC
export AUDIT_JSON AUDIT_MD

python3 <<'PY'
import json
import os
from datetime import UTC, datetime
from pathlib import Path

def rc(name: str) -> int:
    return int(os.environ.get(name, "1"))

pytest_rc = rc("PYTEST_RC")
agent_rc = rc("AGENT_RC")
llm_rc = rc("LLM_RC")
e2e_smoke_rc = rc("E2E_SMOKE_RC")
e2e_func_rc = rc("E2E_FUNC_RC")
compose_rc = rc("COMPOSE_RC")
k8s_rc = rc("K8S_RC")

audit_json = Path(os.environ["AUDIT_JSON"])
audit_md = Path(os.environ["AUDIT_MD"])

layers = [
    ("api_unit_tests", pytest_rc, "API unit tests (pytest)"),
    ("reticle_agent_eval", agent_rc, "Reticle-mirror agent eval"),
    ("reticle_llm_eval", llm_rc, "Reticle-mirror LLM eval (FreeLLMAPI)"),
    ("e2e_smoke", e2e_smoke_rc, "Playwright smoke (pages load)"),
    ("e2e_functional", e2e_func_rc, "Playwright functional (buttons/forms)"),
    ("docker_compose", compose_rc, "Docker Compose prod stack"),
    ("local_k3d", k8s_rc, "Local Kubernetes (k3d)"),
]

core_ok = pytest_rc == 0 and agent_rc == 0 and e2e_smoke_rc == 0 and e2e_func_rc == 0
infra_ok = compose_rc == 0 and k8s_rc == 0
llm_ok = llm_rc == 0

if core_ok and infra_ok and llm_ok:
    verdict = "READY_LOCAL_PROTOTYPE"
    summary = "Fully functional local prototype — suitable to begin cloud deployment planning."
elif core_ok and infra_ok:
    verdict = "READY_LOCAL_PROTOTYPE_LLM_OPTIONAL"
    summary = "Core app works locally; LLM gateway check failed (start FreeLLMAPI or check keys)."
elif core_ok:
    verdict = "CORE_OK_INFRA_GAPS"
    summary = "UI + API work in dev; fix Docker/k3s smoke before cloud deploy."
else:
    verdict = "NOT_READY"
    summary = "Core functional gaps remain — see failed layers."

gaps = [
    "Workflow canvas pipeline preview on /workflows is decorative (not live run state).",
    "Agents and Builder pages are informational — no live CRUD yet.",
    "SearXNG/Firecrawl/Langfuse are Compose placeholders — not real integrations.",
    "Cloud deploy page is a plan preview — AWS/GCP (Phase 6) not built.",
    "Reticle GUI is for manual eval import; loop uses headless mirrors (eval:agent, eval:llm).",
]

report = {
    "timestamp": datetime.now(UTC).isoformat(),
    "verdict": verdict,
    "summary": summary,
    "layers": {k: {"status": "PASS" if r == 0 else "FAIL", "exit_code": r, "label": l} for k, r, l in layers},
    "known_prototype_limits": gaps,
}
audit_json.write_text(json.dumps(report, indent=2) + "\n")

md = [
    "# Functional audit — local prototype",
    "",
    f"**Generated:** {report['timestamp']}",
    f"**Verdict:** `{verdict}`",
    "",
    summary,
    "",
    "## Layer results",
    "",
    "| Layer | Status |",
    "|-------|--------|",
]
for _, r, l in layers:
    md.append(f"| {l} | **{'PASS' if r == 0 else 'FAIL'}** |")
md.extend(["", "## Known prototype limits", ""])
md.extend(f"- {g}" for g in gaps)
md.extend(["", "## Reticle", "", "- `npm run eval:agent` / `npm run eval:llm`", f"- JSON: `{audit_json}`", ""])
audit_md.write_text("\n".join(md) + "\n")
print(f"Verdict: {verdict}")
print(f"Report: {audit_md}")
PY

cat "$AUDIT_MD"
failed=$((PYTEST_RC + AGENT_RC + LLM_RC + E2E_SMOKE_RC + E2E_FUNC_RC + COMPOSE_RC + K8S_RC))
exit $([ "$failed" -eq 0 ] && echo 0 || echo 1)
