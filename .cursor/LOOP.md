# Autonomous execution loop — AgentOps Studio

**End goal:** Demo-ready product on `cursor/ui-deploy-goal` — all automated gates green, Reticle eval pack installed, PR open, merge-ready.

**Mode:** Autonomous. Only pause for merge-to-main approval or secrets/API keys.

## Loop cycle (repeat until end goal)

```
Run gates → Agent eval (Reticle pack) → Fix gaps → Commit/push → repeat
```

## Gates (must pass each cycle)

| Gate | Command | Target |
|------|---------|--------|
| API unit | `cd apps/api && .venv/bin/pytest -q` | 37+ pass |
| Web E2E | `npm run test:e2e:web` | 14+ pass (port 3010) |
| Agent outcomes | `python3 scripts/agent-outcome-eval.py` | all checks pass |
| Web build | `npm run build:web` | success |
| Compose config | `docker compose config -q` | valid |

## Reticle (installed)

- **App:** `tools/reticle/Reticle.app` (v0.2.4 aarch64)
- **Open:** `open tools/reticle/Reticle.app`
- **Import evals:** `tools/reticle/evals/agentops-agent-tests.json`
- **Import scenarios:** `tools/reticle/evals/agentops-scenario-tests.json`
- **Agent config:** `tools/reticle/agents/agentops-orchestrator.json`

## Cycle log

### Cycle 1 — 2026-07-10
- Installed Reticle v0.2.4 to `tools/reticle/`
- Created autonomous loop + agent outcome eval harness
- Running full gate suite + PR creation
