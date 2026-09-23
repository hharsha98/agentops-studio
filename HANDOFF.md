# HANDOFF — AgentOps Studio public demo

Public host (distinct from Agent Fleet): **https://agentops.169.58.185.43.sslip.io/**

| Process | Bind | Port | Notes |
|---|---|---|---|
| AgentOps web | `0.0.0.0` | **3010** | `scripts/prod-web.sh` (`next start`, not hot reload) |
| AgentOps API | `0.0.0.0` | **8010** | `scripts/prod-api.sh` (one worker, no `--reload`) |
| Agent Fleet web / API | | 3002 / 8000 | Do not bind these |
| RAG demo | | 8402 | Do not bind this |

Full write-up: [docs/deployment/contabo.md](docs/deployment/contabo.md).

## What a stranger can do on first visit

`DEMO_PUBLIC=true` (default) runs two real workflows at API startup:

- **Product research** → `done`, with RAG citations and traces
- **Executive daily brief** → `approval`, with citations, artifact, and an Approve action

Then:

1. Open `/dashboard` (seeded brief is already selected).
2. **Approve sandbox action** (sandbox Slack post only; nothing is sent).
3. Open **Runs**, **Traces**, **Knowledge** (refund-policy hits load immediately), **MCP** (invoke `knowledge_search`), **Workflows** (start another DAG).

Deploy (`/cloud`) is documentation for this native path plus optional Compose. It does not provision machines.

## Production commands (no Docker)

```bash
cp .env.example .env
bash scripts/prod-api.sh          # 0.0.0.0:8010
bash scripts/prod-web.sh          # 0.0.0.0:3010, builds on first run
bash scripts/smoke-public.sh
npm run test:api
```

The browser calls same-origin `/api`. Either:

- Caddy strips `/api` and proxies to `127.0.0.1:8010`, or
- Next.js `app/api/[...path]` proxies to `API_PROXY_TARGET`. `prod-web.sh` sets that to `http://127.0.0.1:$API_PORT` and ignores an inherited `:8000` value. Set `API_PROXY_ORIGIN` only for a different upstream.

`NEXT_PUBLIC_API_URL=/api` is forced by `prod-web.sh` unless `PUBLIC_API_ORIGIN` is set (that path needs a rebuild because `NEXT_PUBLIC_*` is inlined).

## systemd

Units: `infra/systemd/agentops-api.service`, `infra/systemd/agentops-web.service`.
Install path in the examples is `/opt/agentops-studio`.

```ini
# /etc/systemd/system/agentops-api.service
[Unit]
Description=AgentOps Studio API (public demo)
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/agentops-studio
Environment=API_PORT=8010
Environment=PORT=8010
Environment=DEMO_PUBLIC=true
Environment=PUBLIC_DEMO_MODE=true
Environment=FORCE_DETERMINISTIC=false
Environment=MODEL_BASE_URL=http://127.0.0.1:20128/v1
Environment=MODEL_NAME=auto
Environment=MODEL_TIMEOUT_SECONDS=25
Environment=RUN_DB_PATH=/var/lib/agentops/studio.sqlite
Environment=DEMO_DATA_DIR=/opt/agentops-studio/demo-data
EnvironmentFile=-/etc/agentops-studio.env
ExecStart=/opt/agentops-studio/scripts/prod-api.sh
Restart=on-failure
RestartSec=3
TimeoutStartSec=180

[Install]
WantedBy=multi-user.target
```

```ini
# /etc/systemd/system/agentops-web.service
[Unit]
Description=AgentOps Studio web (public demo)
After=network.target agentops-api.service
Wants=agentops-api.service

[Service]
Type=simple
WorkingDirectory=/opt/agentops-studio
Environment=WEB_PORT=3010
Environment=API_PORT=8010
ExecStart=/opt/agentops-studio/scripts/prod-web.sh
Restart=on-failure
RestartSec=3
TimeoutStartSec=600

[Install]
WantedBy=multi-user.target
```

```bash
sudo cp infra/systemd/agentops-*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now agentops-api.service agentops-web.service
```

After a UI change: `FORCE_WEB_BUILD=1` once, then restart `agentops-web`.

## Caddy

File: `infra/caddy/agentops.Caddyfile`. Do not merge this into the Fleet site block.

```caddy
agentops.169.58.185.43.sslip.io {
	encode gzip zstd

	handle /api/* {
		uri strip_prefix /api
		reverse_proxy 127.0.0.1:8010
	}

	handle {
		reverse_proxy 127.0.0.1:3010
	}
}
```

```bash
# inside the existing /etc/caddy/Caddyfile
import /opt/agentops-studio/infra/caddy/agentops.Caddyfile
```

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Optional API vhost `agentops-api.169.58.185.43.sslip.io` → `127.0.0.1:8010` is commented in the snippet. CORS already allows `https://agentops.169.58.185.43.sslip.io`. Prefer same-origin `/api`.

Publish 80/443. The app ports are bound on `0.0.0.0` so Caddy and on-box smoke can reach them; restrict 8010/3010 with ufw if only Caddy should be public.

## Local hot reload (not the Contabo ports)

```bash
bash scripts/dev-api.sh     # :8000 --reload
npm run dev:web             # :3000
bash scripts/smoke.sh
```

## Optional Compose

`docker compose up` publishes **3010** and **8010** on the host (container ports stay 3000/8000). Not required for the public demo. See [docs/deployment/docker-compose.md](docs/deployment/docker-compose.md).

## Honest gaps

- Real OmniRoute completions need `MODEL_API_KEY` in `/etc/agentops-studio.env` on the VM. This repo does not contain a key. Without it, `/health` reports `llm.probe=not_configured` and operator runs stay on templates (`mode=deterministic`). With a bad key, runs finish as `degraded`.
- Seeded showcase runs are always templates, even when the key is set, so process start does not fan out into the gateway.
- RAG is TF-IDF over `demo-data/knowledge`, not pgvector.
- MCP is an in-process sandbox registry, not remote MCP servers. Slack/Gmail/GitHub writes are not sent.
- Langfuse and Firecrawl are not running. Traces are internal spans, plus `kind=model` when OmniRoute answers.
- Terraform is README-only (no `.tf`). k3d manifests are scaffolding; keep API replicas at 1.
- `/cloud` documents the host. It does not provision machines.
- This workspace cannot restart `agentops-api.service` on Contabo. Pull the branch on the VM, install the env file, then restart the units (`FORCE_WEB_BUILD=1` for the web unit).

## Verification

Local production servers on this branch (`scripts/prod-api.sh`, `scripts/prod-web.sh`), 2026-09-23. No OmniRoute key was present in the environment.

| Check | Result |
|---|---|
| `npm run test:api` | **PASS** — 25 passed |
| `npm run lint:web` / `npm run typecheck:web` | **PASS** |
| `bash scripts/smoke-public.sh` | **PASS** — wildcard bind 8010/3010, `/api` proxy, CORS, `llm.mode=deterministic` / `probe=not_configured`, seeded approval + done runs, nav HTML 200, executive brief → approve, RAG, knowledge document, MCP invoke |
| Headless Chrome walk | **PASS** — home tile → dashboard, start run, open run, approve to done, workflows, run board, knowledge document, MCP invoke `ok: true`, traces, mobile nav |
| Live OmniRoute completion | **Not run** — `MODEL_API_KEY` is empty here and on the probed public host (`/v1/models` returns 401). Contabo needs `/etc/agentops-studio.env`, then `OMNIROUTE_LIVE=1 bash scripts/smoke-public.sh`. |

Re-run on the Contabo host after pulling this branch, installing the env file, and restarting the units:

```bash
FORCE_WEB_BUILD=1 sudo systemctl restart agentops-api.service agentops-web.service
bash scripts/smoke-public.sh
```
