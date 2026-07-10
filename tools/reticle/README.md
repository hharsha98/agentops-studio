# Reticle — Agent outcome evaluation for AgentOps Studio

[Reticle](https://reticle.run) v0.2.4 is installed locally for **agent/LLM evals** (not web UI clicks).

## Open Reticle

```bash
open tools/reticle/Reticle.app
```

## Import AgentOps eval pack

1. Open Reticle → **Agents** → import `agents/agentops-orchestrator.json`
2. **Evals** → import `evals/agentops-agent-tests.json`
3. **Scenarios** → import `evals/agentops-scenario-tests.json`

## Automated mirror (loop / CI)

```bash
python3 scripts/agent-outcome-eval.py
```

## Full loop

```bash
chmod +x scripts/autonomous-loop.sh && ./scripts/autonomous-loop.sh
```
