# Reticle — Agent outcome evaluation for AgentOps Studio

[Reticle](https://reticle.run) v0.2.4 is installed locally for **agent/LLM evals** (not web UI clicks).

## Keys (from career-ops)

Auto-configure Reticle + local `.env`:

```bash
npm run setup:reticle
```

This reads your **FreeLLMAPI unified key** from `~/career-ops/extension/config.json` and writes it into Reticle’s local database (`Settings → API Keys → OpenAI`). It also copies `GEMINI_API_KEY` from `~/career-ops/.env` into Reticle’s Google slot when present.

**FreeLLMAPI proxy** (10+ providers via one key):

```bash
cd ~/dev/freellmapi && npm run dev -w server   # http://localhost:3001/v1
```

## Open Reticle

```bash
open tools/reticle/Reticle.app
```

In Reticle: **Settings → API Keys** — keys should already be filled after `npm run setup:reticle`.

## Import AgentOps eval pack

1. Open Reticle → **Agents** → import `agents/agentops-orchestrator.json`
2. **Evals** → import `evals/agentops-agent-tests.json`
3. **Scenarios** → import `evals/agentops-scenario-tests.json`

## Automated mirrors (loop / CI)

```bash
npm run eval:agent    # API outcome checks (no LLM)
npm run eval:llm      # FreeLLMAPI chat + LLM-judge style check
```

## Full loop

```bash
chmod +x scripts/autonomous-loop.sh && ./scripts/autonomous-loop.sh
```

## Reticle v0.2.4 note

Reticle sends OpenAI calls to `api.openai.com` (no custom base URL yet). The FreeLLMAPI key is stored for when Reticle adds proxy URL support. **In-app LLM evals** use the **Google/Gemini** key today; **multi-provider FreeLLMAPI** evals run headlessly via `npm run eval:llm`.
