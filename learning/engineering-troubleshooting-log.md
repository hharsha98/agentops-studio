# Engineering Troubleshooting Log

This log captures engineering incidents that explain how AgentOps Studio was built, debugged, tested, and prepared for deployment.

## Incident Template

### Incident
What broke?

### Why It Matters
What engineering concept does this incident teach?

### Symptoms
What did we see?

### Root Cause
Why did it happen?

### Debugging Steps
What commands/checks did we run?

### Fix
What changed?

### Verification
How did we confirm it worked?

### How To Explain It
How can this be explained clearly in beginner-friendly but professional language?

---

## Incident 001: Project scaffold created before managed deployment

### Incident
We intentionally started with a local product shell instead of deploying to managed cloud infrastructure immediately.

### Why It Matters
This incident explains why local-first development is more reliable and cost-aware than starting in the cloud.

### Symptoms
There was no app yet, only an empty Git repository.

### Root Cause
Cloud deployment before a stable local app wastes credits and makes debugging harder because app errors and cloud errors get mixed together.

### Debugging Steps
We checked local versions:

```bash
node --version
npm --version
python3 --version
git status --short --branch
```

### Fix
We created a local-first scaffold with a Next.js web app, FastAPI API, Docker Compose, local Kubernetes manifests, provider-specific deployment docs, and this troubleshooting log.

### Verification
Next verification steps are dependency install, frontend typecheck/build, backend tests, and local dev server smoke test.

### How To Explain It
I built locally first because Kubernetes and cloud platforms add operational complexity. By proving the app locally with Docker and local Kubernetes, I can separate application bugs from infrastructure bugs, save cloud credits, and explain the deployment path more clearly.

---

## Incident 002: npm audit suggested an unsafe forced downgrade

### Incident
After installing frontend dependencies, `npm audit` reported 2 moderate vulnerabilities from PostCSS through Next.js.

### Why It Matters
This incident shows how to handle dependency vulnerabilities without breaking the application.

### Symptoms
The command below reported a PostCSS advisory and suggested `npm audit fix --force`:

```bash
npm audit --audit-level=moderate
```

The suggested forced fix would have installed an old major version of Next.js, which is a breaking change.

### Root Cause
The dependency tree included `postcss@8.4.31`, while the advisory required a patched version newer than `8.5.10`.

### Debugging Steps
We checked the latest available versions:

```bash
npm view next version
npm view postcss version
npm ls postcss
```

### Fix
We updated Next.js to the latest available version and added an npm override so the dependency tree uses patched PostCSS:

```json
"overrides": {
  "postcss": "^8.5.16"
}
```

Then we refreshed the package:

```bash
npm update postcss
```

### Verification
The verification command returned `found 0 vulnerabilities`:

```bash
npm audit --audit-level=moderate
```

### How To Explain It
I did not blindly run `npm audit fix --force` because it would have downgraded a core framework and could break the app. I inspected the vulnerable dependency, checked available patched versions, used an npm override for the transitive dependency, and verified that the audit was clean.

---

## Incident 003: FastAPI test client dependency warning

### Incident
Backend tests passed, but pytest printed a deprecation warning from FastAPI/Starlette's test client.

### Why It Matters
This incident shows how to treat dependency warnings when tests still pass.

### Symptoms
The tests passed with this summary:

```bash
2 passed, 1 warning
```

The warning said Starlette's current `httpx` test-client path is deprecated and points toward `httpx2`.

### Root Cause
FastAPI depends on Starlette, and Starlette is transitioning its test-client dependency path. The warning comes from framework internals, not from AgentOps Studio code.

### Debugging Steps
We confirmed the warning did not fail tests and that both API tests passed:

```bash
pytest -q
```

### Fix
No code fix was needed for the scaffold. We kept the warning documented so it can be revisited when the framework ecosystem stabilizes.

### Verification
The backend health and platform summary tests pass.

### How To Explain It
I do not ignore warnings, but I triage them. This warning came from a framework dependency and did not affect behavior. I documented it, kept tests passing, and would pin or upgrade dependencies later if it became a real compatibility issue.

---

## Incident 004: Next.js lint command changed

### Incident
The frontend lint command failed after upgrading to the latest Next.js version.

### Why It Matters
This incident shows how to handle framework upgrades and broken developer tooling.

### Symptoms
This command failed:

```bash
npm run lint:web
```

The output said:

```text
Invalid project directory provided, no such directory: .../apps/web/lint
```

### Root Cause
The old `next lint` command is not the correct lint entrypoint for this Next.js version. Next treated `lint` like a directory argument.

### Debugging Steps
We read the command output, identified that the failure was CLI usage rather than application code, and replaced the script with direct ESLint execution.

### Fix
We changed the lint script to:

```json
"lint": "eslint ."
```

We also added `eslint.config.mjs` using Next's core web vitals and TypeScript rules.

### Verification
Run:

```bash
npm run lint:web
```

### How To Explain It
Framework upgrades can change CLI commands. I treated the failure as a tooling compatibility issue, updated the lint entrypoint to the supported ESLint command, and kept the project on the newer safer dependency version instead of downgrading.

---

## Incident 005: Next.js runtime rejected icon components stored in data objects

### Incident
After improving the homepage design, the page initially produced a Next.js runtime error related to Lucide icon components inside imported data objects.

### Why It Matters
This incident explains React Server Components and client/server boundaries in modern Next.js apps.

### Symptoms
The dev server logged errors like:

```text
Functions cannot be passed directly to Client Components
```

It also warned about invalid lowercase tags such as `<bot>` and `<workflow>`.

### Root Cause
The shared data module stored React icon components directly inside objects. In Next.js App Router, data that crosses server/client boundaries should stay serializable. A serializable value is data that can be safely converted to plain JSON-like values such as strings, numbers, booleans, arrays, and objects.

### Debugging Steps
We checked the server logs, then inspected the rendered HTML for invalid lowercase icon tags:

```bash
curl -s http://localhost:3000/ | rg "<bot|<workflow|<layers|<git|<mail|<slack"
```

We also verified the final browser state with a DOM check.

### Fix
We changed the shared data file to store plain icon names like `"bot"` and `"workflow"` instead of icon component functions. The homepage now maps those names to Lucide components locally with `getIcon()`.

### Verification
The browser check confirmed:

```text
11 sections
39 rich cards
50 SVG icons
0 invalid icon tags
no runtime error text
```

### How To Explain It
I learned not to store React components inside shared data objects that may cross server/client boundaries. I kept the data serializable and mapped icon keys to real components at the rendering layer, which fixed the runtime error while preserving the design.

---

## Incident 006: Public product copy exposed internal planning language

### Incident
The homepage included copy that referenced competitor inspiration, private planning context, and specific cloud vendors too directly.

### Why It Matters
Public product copy should describe customer value, reliability, and operational capability. Internal planning context belongs in private notes, not in the product interface.

### Symptoms
Several headings and labels sounded like planning notes instead of a professional SaaS product.

### Root Cause
The first version mixed project-planning language with customer-facing language. That made the UI feel less polished even though the feature set was strong.

### Debugging Steps
We searched the frontend and docs for terms that should not appear in the public product UI. The search covered competitor names, private planning terms, and overly specific cloud-vendor labels.

```bash
rg -n "<non-product terms>" apps/web README.md docs learning
```

We also checked the rendered homepage in the browser to confirm the visible text did not contain those terms.

### Fix
We rewrote the homepage, cloud page, research page, README, and learning-log introduction with professional vendor-neutral language. Cloud capability is now described as managed Kubernetes, cloud readiness, portability, and infrastructure as code.

### Verification
The live homepage check returned no matches for competitor, private-planning, or vendor-specific terms. Frontend typecheck, lint, and production build also passed.

### How To Explain It
I separated internal project strategy from public product messaging. The application can still prove cloud deployment skills, but the UI now speaks like a product for teams: reliability, portability, auditability, cost control, and safe operations.

---

## Incident 007: Diagram connectors and product copy needed a quality pass

### Incident
The homepage workflow diagram used connector lines that could visually compete with node text, and several pages still used internal planning words instead of product-facing language.

### Why It Matters
Frontend polish is not only colors and layout. Clear copy, readable diagrams, and professional wording affect whether users trust the product.

### Symptoms
The live replay diagram felt crowded, and some headings repeated narrow positioning or used weak demo language.

### Root Cause
The first design used simple positioned line elements and early planning copy. That was enough for a prototype, but not good enough for a polished product surface.

### Debugging Steps
We searched the frontend for weak wording, checked the rendered homepage text, and inspected diagram layering in the browser.

### Fix
We replaced overlapping line blocks with SVG connector paths behind the node cards, added colored node badges, rewrote the hero and page headings, and replaced weak wording with product-facing language.

### Verification
Typecheck, lint, and production build passed. A route-by-route text scan found no blocked phrases, and the browser check confirmed connector paths render behind the workflow nodes.

### How To Explain It
I treated UI copy and diagrams as part of product engineering. I verified the source text, rendered HTML, and visual layering so the interface communicates clearly without exposing internal planning language.

---

## Incident 008: Homepage did not communicate a multi-agent system strongly enough

### Incident
The homepage looked polished in parts, but it still felt too generic for a serious multi-agent platform.

### Why It Matters
For an AI engineering project, the UI should make the system architecture obvious: orchestration, agents, tools, memory, approvals, traces, evaluation, and deployment.

### Symptoms
The page used broad product language and card sections, but the first screen did not immediately show a believable agent runtime.

### Root Cause
The design focused on platform coverage before showing the core operating model. Visitors needed to infer how agents, workflows, RAG, tools, and traces worked together.

### Debugging Steps
We inspected a reference multi-agent platform, identified its strongest content pattern, and compared it with AgentOps Studio. The reference emphasized concrete product sections: multi-agent chat, deep research, Kanban workflows, runtime builder, document intelligence, observability, built-in agents, and workflow execution.

### Fix
We rebuilt the homepage around a realistic operations console: orchestrator chat, agent execution graph, run inspector, Kanban state, specialized agents, execution stages, RAG/research, MCP builder, tech stack, and observability.

### Verification
Typecheck, lint, and production build passed. The browser confirmed the new page renders one operations console, three chat messages, five graph nodes, six agent cards, and fifteen technology chips with no blocked wording.

### How To Explain It
I changed the page from a generic landing page into a product surface that demonstrates the architecture of a multi-agent system. The UI now shows how goals become agent graphs, how tools and memory are used, and how teams inspect, approve, and evaluate outputs.

---

## Incident 009: Frontend moved from static mockups to backend-backed replay data

### Incident
The dashboard, workflow page, and run replay page originally showed mostly static UI content. We needed the product to behave more like a real agent platform by reading workflow and run data from an API.

### Why It Matters
This incident explains the difference between a visual prototype and an application. A prototype can look good, but an application needs APIs, data models, tests, and error handling.

### Symptoms
The UI could describe agent operations, but it did not yet prove that the frontend could consume backend data for runs, tasks, traces, artifacts, and workflow templates.

### Root Cause
The first project slice focused on product shell and visual structure. The next development step was to create a backend contract. A backend contract is the agreed shape of data that the API sends and the frontend receives.

### Debugging Steps
We wrote backend tests first:

```bash
pytest tests/test_runs.py -q
```

The tests failed with 404 responses because the run and workflow endpoints did not exist yet. That was expected in test-driven development, where a failing test confirms the missing behavior before implementation.

### Fix
We added a replay data file, typed FastAPI schemas, an in-memory replay store, and API routes for runs and workflows. The frontend now fetches these routes and falls back to the same local demo data if the API is offline.

The new backend routes are:

```text
GET /runs
GET /runs/{run_id}
POST /runs/replay
GET /workflows
```

### Verification
Backend tests passed:

```bash
pytest -q
```

Frontend checks passed:

```bash
npm run typecheck:web
npm run lint:web
npm run build:web
```

We also checked the local pages with `curl`, which is a terminal tool for requesting a web page or API endpoint:

```bash
curl http://localhost:3000/dashboard
curl http://localhost:3000/runs
curl http://localhost:3000/workflows
```

### How To Explain It
I converted static product screens into backend-backed screens. I defined typed API schemas, wrote tests for the run and workflow endpoints, added seeded replay data, and connected the Next.js frontend to the FastAPI backend with a local fallback so the demo still works even when the API server is not running.

---

## Incident 010: Workflow replay button did not update the UI at first

### Incident
We added a workflow replay button so the frontend could start a backend run, but the first browser test did not show a success message.

### Why It Matters
This incident teaches three production concepts: unique IDs, environment configuration, and server-action boundaries. A server action is a Next.js function that runs on the server when a form is submitted.

### Symptoms
The workflow page rendered the replay forms, but submitting the form did not show the expected success panel. A direct API request also returned `404 Not Found` on port `8000`.

### Root Cause
There were two separate issues:

1. Port `8000` was already used by an older FastAPI process from another project, so the frontend was calling the wrong API.
2. The Next.js server-action file exported a normal object as well as an async function. Next.js requires `"use server"` files to export only async functions.

We also found that replay IDs were deterministic, which means repeated clicks on the same workflow could create duplicate run IDs.

### Debugging Steps
We checked which process owned the API port:

```bash
lsof -iTCP:8000 -sTCP:LISTEN -P -n
ps -p <pid> -o pid,ppid,command
```

We tested the API directly:

```bash
curl -X POST http://localhost:8001/runs/replay \
  -H 'Content-Type: application/json' \
  -d '{"workflow_id":"executive-daily-brief","goal":"Prepare a leadership daily brief for pipeline, support, and delivery risks."}'
```

We also checked the Next.js dev server logs, which showed the server-action export error.

### Fix
We generated unique replay IDs with a short UUID suffix. We moved the initial UI state object out of the `"use server"` file and kept that file limited to the async replay action.

For local verification, we ran this project's API on port `8001` and restarted the web app with:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001 npm run dev -w apps/web -- --port 3000
```

### Verification
Backend tests passed:

```bash
pytest -q
```

Frontend checks passed:

```bash
npm run typecheck:web
npm run lint:web
npm run build:web
```

The browser test confirmed that the workflow form created a run and opened `/runs?runId=<created-run-id>` with the new run details visible.

### How To Explain It
I added a real product loop: a user can choose a workflow, submit an operating goal, create a backend replay run, and inspect that run on the execution board. During debugging, I isolated a port conflict, fixed a Next.js server-action boundary issue, and added a regression test so replay runs always receive unique IDs.
