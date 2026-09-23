# Contabo public demo (native Node + Python)

AgentOps Studio’s public host is **https://agentops.169.58.185.43.sslip.io/**.

That host is not Agent Fleet. Fleet stays at `https://agentfleet.169.58.185.43.sslip.io/` on ports **8000** (API) and **3002** (web). A separate RAG demo uses **8402**. This app uses:

| Process | Bind | Port |
|---|---|---|
| API (`scripts/prod-api.sh`) | `0.0.0.0` | **8010** |
| Web (`scripts/prod-web.sh`) | `0.0.0.0` | **3010** |
| Caddy | public 80/443 | proxies `/` → 3010 and `/api/*` → 8010 |

No Docker is required. `DEMO_PUBLIC=true` (the default) executes two template workflows at startup: a finished product-research run and an executive brief waiting in `approval`, both with citations and traces. Operator-started runs call OmniRoute when a key is configured. Run state is SQLite at `RUN_DB_PATH` so a restart keeps the board. The API is still a **single uvicorn worker**.

## OmniRoute

OmniRoute is already on this VM (`omniroute.service`, public vhost `https://omniroute.169.58.185.43.sslip.io/`). Studio calls the OpenAI-compatible API on localhost so runs do not depend on public TLS:

```text
MODEL_BASE_URL=http://127.0.0.1:20128/v1
MODEL_NAME=auto
```

Create the key file (mode `0600`). Do not commit it and do not put the key in the unit file:

```bash
sudo install -m 600 /dev/null /etc/agentops-studio.env
# Add one line, then save: MODEL_API_KEY=<omniroute api key>
```

`GET /health` then reports `llm.configured=true` and `llm.probe` of `ok`, `auth_failed`, `unreachable`, or `pending`. If the file is missing, runs still complete on templates and `llm.probe` is `not_configured`. That is the remaining operator step; the app does not crash.

Seeded showcase runs never call the model, so API boot stays fast. A dashboard **Start multi-agent run** does. A gateway timeout or 401 marks that run `degraded` and keeps the template artifact.

`bash scripts/smoke-public.sh` checks the `llm` object. Set `OMNIROUTE_LIVE=1` only on the VM after the key is installed; that starts one compliance-review run and expects mode `omniroute` or `degraded`.

## One-time setup

```bash
sudo mkdir -p /opt/agentops-studio
sudo chown "$USER" /opt/agentops-studio
git clone https://github.com/hharsha98/agentops-studio.git /opt/agentops-studio
cd /opt/agentops-studio
cp .env.example .env
```

Prerequisites on the VM: Node.js 22+, npm 10+, Python 3.12+ with `python3-venv`.

## Run in the foreground

```bash
bash scripts/prod-api.sh
# another shell
bash scripts/prod-web.sh
```

`prod-web.sh` builds the Next.js app the first time (or when `FORCE_WEB_BUILD=1`). The client bundle calls `/api`. The Next server proxies that to `http://127.0.0.1:$API_PORT` (8010). An inherited `API_PROXY_TARGET` from `.env` (dev uses `:8000`) does not override that. Set `API_PROXY_ORIGIN` only for a different upstream. Set `PUBLIC_API_ORIGIN` only if the browser must call a different host, and rebuild.

Check:

```bash
bash scripts/smoke-public.sh
```

Then open the dashboard and approve the seeded executive brief. Workflows, Runs, Knowledge, MCP, and Traces are backed by the same API.

## systemd

Copy the units (edit `WorkingDirectory` if the checkout is not `/opt/agentops-studio`):

```bash
sudo cp infra/systemd/agentops-api.service /etc/systemd/system/
sudo cp infra/systemd/agentops-web.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now agentops-api.service agentops-web.service
```

`agentops-api.service`:

```ini
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

`agentops-web.service`:

```ini
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

After a git pull that changes the UI, rebuild once:

```bash
cd /opt/agentops-studio
FORCE_WEB_BUILD=1 bash scripts/prod-web.sh
```

Or restart the web unit after that build finishes. `SKIP_WEB_BUILD=1` skips the build even if `.next` is missing — do not set that on a fresh checkout.

## Caddy

Snippet file: `infra/caddy/agentops.Caddyfile`.

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

Import it from the existing Caddyfile (do not reuse the Fleet site block):

```caddy
import /opt/agentops-studio/infra/caddy/agentops.Caddyfile
```

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

sslip.io names resolve to the embedded IPv4 address, so `agentops.169.58.185.43.sslip.io` points at this VM without extra DNS. Caddy’s default TLS issuer can obtain a certificate for that name.

If Caddy is in front, firewall the raw app ports and publish 80/443 only:

```bash
sudo ufw allow 80,443/tcp
```

Direct `:3010/api/*` still works on the VM via the Next proxy, which is what `smoke-public.sh` checks. With the Caddy `handle /api/*` block, browsers never need that hop: Caddy strips `/api` and calls FastAPI.

### Optional API subdomain

`https://agentops-api.169.58.185.43.sslip.io` can reverse-proxy to `127.0.0.1:8010`. The API already allows the Studio origin in `CORS_ORIGINS`. The web app must be rebuilt with:

```bash
PUBLIC_API_ORIGIN=https://agentops-api.169.58.185.43.sslip.io bash scripts/prod-web.sh
```

Same-origin `/api` is the default and does not need that rebuild.

## What a visitor does

1. Open `/`. Every tile is a link into the console. The status strip reads `/api/health`.
2. Open `/dashboard`. The seeded executive brief is in the approval queue, with citations.
3. Choose **Approve** (sandbox Slack only) or **Start multi-agent run**.
4. Open the run from the board (`/runs`, then `/runs/{id}`), **Knowledge** (select a document or retrieve), **MCP** (edit JSON and invoke), and **Traces** (filter by run).

## Verify

```bash
bash scripts/smoke-public.sh
npm run test:api
```

`smoke-public.sh` checks wildcard binds, `/health` including the `llm` object, the web `/api` proxy, CORS for the sslip.io origin, seeded runs, every nav route, a new executive brief through approve, RAG, a knowledge document, and an MCP invoke. It does not call OmniRoute unless `OMNIROUTE_LIVE=1`.

## Local dev ports stay different

```bash
bash scripts/dev-api.sh     # 0.0.0.0:8000, --reload
npm run dev:web             # :3000
bash scripts/smoke.sh       # talks to :8000
```

Use the prod scripts on the shared Contabo VM so this app does not bind Fleet’s ports.
