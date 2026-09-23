# AgentOps Studio — full product plan

Status: planning record for the Contabo product pass. Implementation follows this document on the same branch. This product is **AgentOps Studio**, not Agent Fleet (`agentfleet`, ports 8000/3002).

Public host: `https://agentops.169.58.185.43.sslip.io/`  
OmniRoute host already on the same VM: `https://omniroute.169.58.185.43.sslip.io/` (`omniroute.service`, OpenAI-compatible `/v1`, default listen `127.0.0.1:20128`).

No Cloudflare paid features, R2, or card-gated products are part of this plan.

## 1. What was verified (do not assume)

Probed from this workspace on 2026-09-23:

| Check | Result |
|---|---|
| `GET https://agentops.169.58.185.43.sslip.io/api/health` | **200** via Caddy (`via: 1.1 Caddy`, `server: uvicorn`). Body: `knowledge_documents: 4`, `mcp_tools: 6`, `runs: 4`, `demo_public: true`. |
| `GET /api/platform` | Studio naming is correct. `model_gateway` is the string `"auto"`. No live model host is reported. |
| `GET /api/runs` | Seeded and visitor runs exist. Every run `mode` is `"deterministic"`. Artifacts are the template in `orchestration/engine.py`. |
| `GET /`, `/dashboard`, `/workflows` | **200**. Dashboard HTML includes “Start multi-agent run”. JS chunks return 200. |
| `GET https://omniroute.169.58.185.43.sslip.io/v1/models` | **401** `invalid_api_key`. The gateway is up. This repo has no key, and must not gain one in git. |
| `/health`, `/api/health`, `/login`, `/dashboard` on the OmniRoute host | **404**. The compatible surface is `/v1/...`, not an AgentOps route. |

So the VPS is not an empty static file server. Caddy already strips `/api` and reaches FastAPI. The product still *feels* like a dead demo because of the gaps below.

## 2. Current gaps

### 2.1 Clicks that do nothing

The homepage (`apps/web/app/page.tsx`) renders feature tiles, agent cards, workflow cards, execution stages, and the hero “Run AO-204” console as inert `<article>` / `<div>` nodes. They look like controls. Only the nav and two hero links navigate.

Inside the console:

- Workflow **Run** does not open the created run.
- Kanban cards on `/runs` are not links. **Approve** is the only control, and only while `status === approval`.
- Knowledge documents are not selectable; there is no document-detail API.
- MCP **Invoke** uses hidden hardcoded arguments. There is no input, so a click with a failed API looks like nothing happened until an error string appears.
- Traces dump the first 24 spans with no run filter and no way to open the parent run.
- `/builder`, `/benchmarks`, `/research` are essays that say the feature is not running.
- Client pages have no loading skeleton. A slow or failed `/api` leaves an empty grid.

`apps/web/app/globals.css` hides decorative SVG hit-targets (`pointer-events: none` on `.dag-lines`). That is fine for decoration. Combined with non-links, it matches the “clicks open nothing” report. Nav links themselves are real `<a>` tags down to 680px (the old `display: none` bug is already fixed in this repo).

### 2.2 Demo-only behavior

- `OrchestrationEngine` never calls a model. Summaries and artifacts are string templates (`apps/api/app/orchestration/engine.py`).
- `FORCE_DETERMINISTIC` defaults to `true` in `scripts/prod-api.sh`, `scripts/dev-api.sh`, `infra/systemd/agentops-api.service`, Compose, and `.env.example`.
- `MODEL_BASE_URL` defaults to `http://localhost:3001/v1` (a leftover FreeLLMAPI note). Nothing on Contabo listens there for this app. OmniRoute is not referenced.
- `settings.model_api_key` is unused by the engine.
- RAG is local TF-IDF over `demo-data/knowledge`. That part is real and should stay; it does not need a paid embedder.
- MCP tools are an in-process registry. Slack, Gmail, and GitHub writes are sandbox records. That is the correct public-demo policy and stays.
- `RunStore` is process memory. A restart of `agentops-api.service` drops runs, approvals, and traces. Seed recreates two showcase runs only.
- Postgres/pgvector and Redis exist only as optional Compose profiles. They are not on the native Contabo path. Do not make the product depend on them.

### 2.3 API ↔ web proxy (suspected, then checked)

Two hops exist, and both are valid:

1. **Browser → Caddy → API.** `infra/caddy/agentops.Caddyfile` `handle /api/*` strips `/api` and proxies to `127.0.0.1:8010`. Live probe confirms this.
2. **Browser → Next → API.** `apps/web/app/api/[...path]/route.ts` plus `scripts/prod-web.sh`, which pins `API_PROXY_TARGET=http://127.0.0.1:$API_PORT` so an inherited `:8000` from `.env` cannot win. Direct `:3010/api/health` is what `scripts/smoke-public.sh` checks.

No code change is required to “make the proxy exist.” The pass still needs:

- Health and platform payloads that tell the UI whether the model gateway is configured, so a proxy 200 is not confused with a live LLM.
- Smoke coverage that fails if the client bundle bakes `localhost:8000` (already present) and if new pages lack their primary controls.
- UI errors that surface proxy `502` JSON (`API proxy failed`) instead of a blank panel.

### 2.4 What will not be pretended

- This workspace cannot SSH to Contabo or restart `agentops-api.service`. Shipping the branch does not flip the live host by itself.
- OmniRoute rejected an unauthenticated `/v1/models`. Real completions need `MODEL_API_KEY` in a root-owned env file on the VM, never in git.
- SearXNG is optional. `web_search` keeps its offline fallback when `:8080` is closed.
- Remote MCP servers, Langfuse, Firecrawl, and Terraform apply are out of scope.

## 3. Production architecture on Contabo

```
browser
  → Caddy :443  agentops.169.58.185.43.sslip.io
       /api/*  strip /api → 127.0.0.1:8010  agentops-api.service
       /*                 → 127.0.0.1:3010  agentops-web.service
  API process
       RAG index     demo-data/knowledge (TF-IDF, in-process)
       MCP registry  in-process sandbox tools
       run store     SQLite file when RUN_DB_PATH is set; memory otherwise
       LLM           http://127.0.0.1:20128/v1/chat/completions
                     Authorization: Bearer $MODEL_API_KEY
                     model: $MODEL_NAME (default auto)
  omniroute.service (already installed; do not reinstall or expose its port publicly beyond the existing Caddy vhost)
```

Ports that must stay free for other products: Fleet `8000`/`3002`, RAG demo `8402`. Studio stays `8010`/`3010`. OmniRoute stays on its current port (`20128`); Studio calls it on localhost, not through the public URL, so a TLS or hairpin issue cannot break runs.

Single uvicorn worker stays mandatory while any in-memory structure exists. SQLite writes are serialized with the same lock the store already uses. Do not raise `--workers`.

Startup stays fast: `DEMO_PUBLIC` seed runs **deterministic** workflows (citations and an approval card are guaranteed without a model). Operator-started runs call OmniRoute when a key is configured. A background probe records gateway reachability on `/health` and must not block `lifespan`.

## 4. Frontend redesign goals

Replace the marketing-scale landing (92px hero, fake “Run AO-204”, inert mosaics) with a dense operations product.

Visual system:

- Dark ops console: near-black canvas, 1px slate borders, compact type (page titles ~28px, data 13px).
- Status color is semantic: running = cyan, approval = amber, failed = red, done = green. No gradient hero as the product UI.
- App routes share a left rail: Dashboard, Workflows, Runs, Knowledge, MCP, Traces, Deploy. Secondary routes (Agents, Builder, Benchmarks, Research) stay in the rail so none are orphans.
- Every card that names a destination is an actual link or button.
- Each data page implements loading, empty, and error (with retry). Errors include the API body.

Page behavior:

| Route | Working behavior |
|---|---|
| `/` | Product entry. Tiles link to the console pages. A live status strip reads `/api/health` (gateway mode, runs, docs). |
| `/dashboard` | Metrics, gateway banner, goal field, workflow select, **Start multi-agent run**, approval queue, recent runs linking to detail. |
| `/workflows` | Four DAGs. Shared goal field. **Run** creates a run and links to it. |
| `/runs` | Five-lane board. Card click opens `/runs/[id]`. Approval lane keeps **Approve**. |
| `/runs/[id]` | Goal, steps, citations, artifact, spans, approve when waiting. |
| `/knowledge` | Document list. Selecting a doc loads `GET /knowledge/{id}`. Query box calls `/knowledge/query`. |
| `/mcp` | Tool list, editable JSON arguments, **Invoke**, result panel. |
| `/traces` | Run filter, span list, link to the run, raw output. |
| `/agents` | Roster links into the workflows those agents serve. |
| `/builder` | Goal composer that starts a real run (not a “not in this demo” essay). |
| `/benchmarks` | Scorecards derived from evaluator steps already stored on runs. |
| `/research` | Calls `web_search` through the MCP API and shows results. |
| `/cloud` | Deploy notes including OmniRoute env, not a fake provisioner. |

## 5. API contracts

Existing routes stay. Additive fields are backward compatible.

### `GET /health`

```json
{
  "status": "ok",
  "service": "agentops-api",
  "knowledge_documents": 4,
  "mcp_tools": 6,
  "runs": 2,
  "demo_public": true,
  "public_demo_mode": true,
  "persistence": "memory | sqlite",
  "llm": {
    "mode": "omniroute | deterministic",
    "configured": false,
    "force_deterministic": true,
    "model": "auto",
    "base_host": "127.0.0.1:20128",
    "probe": "skipped | ok | auth_failed | unreachable | not_configured",
    "probe_detail": "short operator string, no secrets"
  }
}
```

`mode` is `omniroute` only when a key is set and `FORCE_DETERMINISTIC` is false. `base_host` is host:port only.

### `GET /platform`

Add `llm` (same object) and set `model_gateway` to the host, not the word `auto` alone. Keep `product: "studio"` and the Fleet distinction.

### Runs

`POST /runs` `{ "workflow_id", "goal?" }` → `RunRecord`.

`RunRecord.mode` becomes one of:

- `deterministic` — templates only (seed, or no key, or forced).
- `omniroute` — at least one successful chat completion grounded the run.
- `degraded` — a completion was attempted and failed; templates filled the gap. `error` may be null; step spans carry the model error.

`GET /runs/{id}` already returns `{ run, spans }`.

`POST /runs/{id}/approve` unchanged: sandbox `slack_post`, status `done`. 400 when not in `approval`.

### Knowledge

`GET /knowledge/{document_id}` → `{ document, chunks }`. 404 unknown.

`POST /knowledge/query` unchanged.

### MCP

`POST /mcp/tools/{name}/invoke` unchanged. UI sends operator-edited `arguments`.

### Model call (server-side only)

```
POST {MODEL_BASE_URL}/chat/completions
Authorization: Bearer {MODEL_API_KEY}
Content-Type: application/json

{
  "model": "{MODEL_NAME}",
  "temperature": 0.2,
  "max_tokens": 700,
  "messages": [
    {"role": "system", "content": "<specialist instructions>"},
    {"role": "user", "content": "<goal + tool evidence>"}
  ]
}
```

Success reads `choices[0].message.content`. Usage and latency land on a `kind: "model"` span. Timeout default 25s. No streaming in v1 (approval UX needs the full artifact). Never log the bearer token. Never send the key to the browser.

Seed path does not call this endpoint.

## 6. OmniRoute integration

New module `apps/api/app/llm/client.py`:

- `configured` = non-empty `MODEL_API_KEY` and `FORCE_DETERMINISTIC` is false.
- `complete(system, user)` posts the contract above with `httpx`.
- Failures return a structured error (`timeout`, `http_401`, `bad_shape`) and do **not** raise out of the engine. The agent step keeps its deterministic text so a gateway outage cannot stick a run in `failed` after tools already succeeded.
- `probe()` calls `GET {base}/models` once at startup on a daemon thread.

Engine (`_run_agent`): tools and RAG run first (grounding). The model may rewrite the summary and, for the drafting agents, the artifact, using only that evidence. Prompts forbid invented citations. Citations on the run still come from the retriever, not from the model.

Contabo unit (`infra/systemd/agentops-api.service`):

```
Environment=MODEL_BASE_URL=http://127.0.0.1:20128/v1
Environment=MODEL_NAME=auto
Environment=FORCE_DETERMINISTIC=false
Environment=RUN_DB_PATH=/var/lib/agentops/studio.sqlite
EnvironmentFile=-/etc/agentops-studio.env
```

`/etc/agentops-studio.env` (mode `0600`, not in git):

```
MODEL_API_KEY=<omniroute api key>
```

If that file is missing, `/health` reports `probe: not_configured` and runs still complete deterministically. The UI banner says so. That is the honest blocker, not a crash.

Local and CI keep `FORCE_DETERMINISTIC=true` (`scripts/test-api.sh` already exports it). Tests inject a fake transport for the client; they must not call the public OmniRoute host.

## 7. Persistence

`apps/api/app/store.py` grows an optional SQLite backend (stdlib `sqlite3`, JSON blobs for `RunRecord` and `TraceSpan`).

- Unset `RUN_DB_PATH` → current memory store (pytest, smoke on a fresh process).
- Set → file created with parent dirs. `seed_public_demo` still no-ops when any run exists.

Compose stays optional and does not gain a hard dependency on Postgres.

## 8. Environment variables

| Variable | Local / CI | Contabo |
|---|---|---|
| `API_PORT` | 8000 dev / 8010 prod scripts | `8010` |
| `WEB_PORT` | 3000 dev / 3010 prod | `3010` |
| `DEMO_PUBLIC` | `true` | `true` |
| `PUBLIC_DEMO_MODE` | `true` | `true` |
| `DEMO_DATA_DIR` | repo `demo-data` | `/opt/agentops-studio/demo-data` |
| `FORCE_DETERMINISTIC` | `true` | `false` |
| `MODEL_BASE_URL` | blank or unused while forced | `http://127.0.0.1:20128/v1` |
| `MODEL_API_KEY` | empty | `/etc/agentops-studio.env` only |
| `MODEL_NAME` | `auto` | `auto` |
| `MODEL_TIMEOUT_SECONDS` | `25` | `25` |
| `RUN_DB_PATH` | unset | `/var/lib/agentops/studio.sqlite` |
| `NEXT_PUBLIC_API_URL` | `/api` | `/api` (baked by `prod-web.sh`) |
| `API_PROXY_TARGET` | dev `:8000`; prod script pins `:8010` | pinned by `prod-web.sh` |
| `CORS_ORIGINS` | includes the sslip.io origin | unchanged |

`.env.example` documents OmniRoute without a secret value. `.env` remains gitignored.

## 9. Smoke and acceptance

Automated (`scripts/smoke-public.sh`, `npm run test:api`, `npm run lint:web`, `npm run typecheck:web`):

- Wildcard bind 8010 and 3010, `/health`, web `/api/health`, CORS for the Studio origin.
- Platform still `product=studio` and names both hosts.
- Seeded approval run and done run with citations.
- New run `executive-daily-brief` → `approval` → approve → `done`, through API and through `/api` proxy.
- RAG refund query and `knowledge_search` invoke.
- `GET /knowledge/{id}` returns chunks for a seeded doc.
- `/health` includes `llm.mode` and `llm.probe`. With the test default, mode is `deterministic`.
- HTML routes contain their primary controls (start run, approve, retrieve, invoke, trace list, run board). Homepage does not revive the banned fake metrics (`18.4k`, `50 benchmarks`, …).
- Client bundle has no `localhost:8000`.

Unit tests added:

- Chat completion parser with `httpx.MockTransport` (no network).
- Missing key does not set `configured`.
- Forced deterministic run has no model span and `mode=deterministic`.
- Injected gateway failure yields `mode=degraded` (or a model span with status `error`) and a still-usable artifact.
- Unknown knowledge id returns 404.

Not claimed green unless a key is present on the machine running smoke:

- A live `POST /v1/chat/completions` to OmniRoute. Optional `OMNIROUTE_LIVE=1` section in smoke curls `/health` and, only when `llm.configured` is true, starts one short workflow and asserts `mode` is `omniroute` or `degraded` with a model span. Default smoke skips it.

Browser pass after the UI lands (local `prod` or `dev` servers): load `/`, follow a tile to `/dashboard`, start a run, open it from the board, approve, query knowledge, invoke a tool, filter traces. Record anything that still 404s or stays disabled.

## 10. Phased checklist

1. **Plan** — this file committed, PR opened. No product code in that commit.
2. **LLM client + health/platform fields** — env, probe, mock tests. Engine uses the client on operator runs only.
3. **SQLite store** behind `RUN_DB_PATH`. Seed idempotency preserved.
4. **API extras** — `GET /knowledge/{id}`.
5. **UI shell and pages** — redesign listed in §4, including run detail.
6. **Copy and deploy docs** — `docs/deployment/contabo.md`, `HANDOFF.md`, systemd unit, `.env.example`, architecture overview, homepage honesty. Compose env points at a host OmniRoute URL only as a comment; default Compose stays deterministic.
7. **Smoke script** updated to the new controls and `llm` object.
8. **Verify** — pytest, lint, typecheck, local smoke. Browser pass of the click paths. Live OmniRoute call only if a key is in the environment (expected: it is not, and the report says so).
9. **PR update** — do not merge. Do not print secrets.

## 11. Files expected to change in the implementation phase

- `apps/api/app/llm/client.py` (new), `config.py`, `main.py`, `models.py`, `store.py`, `orchestration/engine.py`, `apps/api/tests/`
- `apps/web/app/globals.css`, `app/page.tsx`, `app/layout.tsx`, app routes under `app/`, `components/`, `lib/api.ts`, `lib/platform-data.ts`
- `apps/web/app/runs/[id]/page.tsx` (new)
- `scripts/smoke-public.sh`, `.env.example`, `infra/systemd/agentops-api.service`
- `docs/deployment/contabo.md`, `docs/architecture/overview.md`, `HANDOFF.md`, `README.md` (short status, not a rewrite of the whole README)

Out of scope for the code pass: editing the live Caddyfile on the VM, creating the OmniRoute key, `ufw` changes, and any Fleet repo.
