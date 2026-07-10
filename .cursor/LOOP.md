# Autonomous execution loop — AgentOps Studio

**End goal:** Demo-ready product on `cursor/ui-deploy-goal` — all automated gates green, Reticle eval pack + FreeLLMAPI wired, PR open.

**Mode:** Autonomous on branch only. **Do not merge to `main`** unless user explicitly approves later.

## Loop cycle (repeat until end goal)

```
Setup keys → Run gates → Agent eval → LLM eval (FreeLLMAPI) → Fix gaps → Commit/push → repeat
```

## Gates (must pass each cycle)

| Gate | Command | Target |
|------|---------|--------|
| Reticle keys | `npm run setup:reticle` | FreeLLMAPI + Gemini in Reticle DB |
| API unit | `cd apps/api && .venv/bin/pytest -q` | 37+ pass |
| Web E2E | `npm run test:e2e:web` | 14+ pass (port 3010) |
| Agent outcomes | `npm run eval:agent` | all checks pass |
| LLM eval | `npm run eval:llm` | 3/3 FreeLLMAPI checks |
| Web build | `npm run build:web` | success |
| Compose config | `docker compose config -q` | valid |

## Reticle (installed)

- **App:** `tools/reticle/Reticle.app` (v0.2.4 aarch64)
- **Open:** `open tools/reticle/Reticle.app`
- **Import evals:** `tools/reticle/evals/agentops-agent-tests.json`
- **Import scenarios:** `tools/reticle/evals/agentops-scenario-tests.json`
- **Agent config:** `tools/reticle/agents/agentops-orchestrator.json`

## Cycle log

### Cycle 2 — 2026-07-10
- Wired career-ops FreeLLMAPI unified key into Reticle + local `.env`
- Added `npm run eval:llm` headless LLM eval via FreeLLMAPI proxy
- Branch-only development — no merge to `main` until user decides
