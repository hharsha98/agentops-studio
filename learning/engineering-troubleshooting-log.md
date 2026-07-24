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

---

## Incident 011: Replay runs needed visible execution progress

### Incident
After replay creation worked, the run stayed on the first running task. The product needed a way to demonstrate agent execution progress, not only run creation.

### Why It Matters
This incident explains orchestration state. Orchestration state means the current position of a workflow: which task is running, which tasks are done, which tasks are blocked, and whether human approval is required.

### Symptoms
A created replay could be opened from the run board, but it did not yet move through agent steps or create new trace events after creation.

### Root Cause
The first replay feature only created the initial run state. It did not have a transition function that moves a run from one state to the next.

### Debugging Steps
We wrote failing backend tests for a new endpoint:

```bash
POST /runs/{run_id}/advance
```

The first test run failed with `404 Not Found`, which proved the endpoint did not exist yet. After implementation, one test failed because the trace had more events than expected. That revealed a better behavior: recording both `task_completed` and `task_started` gives a clearer audit trail.

### Fix
We added a deterministic run-advance function that:

- Marks the current running task as done.
- Starts the next dependency-ready task.
- Appends trace events for completed and started tasks.
- Pauses at human approval when the approval task becomes ready.
- Creates an approval artifact for review.

The frontend run board now has an `Advance run` button that calls the backend and refreshes the selected run.

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

The browser test confirmed that clicking `Advance run` updated the run board and displayed the next agent task.

### How To Explain It
I added a simple workflow state machine. Each click advances the run by one agent step, updates task states, records trace events, and pauses for human approval when needed. This demonstrates how a multi-agent platform can make execution observable instead of hiding agent work inside one black-box response.

---

## Incident 012: Replay runs disappeared after API restart risk

### Incident
Replay runs were stored only in process memory. That means a run created from the UI would disappear if the API process restarted.

### Why It Matters
Kubernetes can restart pods during deployments, crashes, scaling, or node maintenance. If application state only lives in memory, users lose work after a restart. Persistent storage is a core production requirement.

### Symptoms
The app could create and advance runs, but the run store was a Python list inside the API process.

### Root Cause
The first implementation optimized for fast product behavior. It did not yet have a database-backed repository for saving and loading run state.

### Debugging Steps
We wrote repository tests that used a temporary SQLite database and created a run through the normal replay function. Then we constructed a new repository instance pointing to the same database file and verified the run could still be loaded.

We also ran a manual restart smoke test:

```bash
curl -X POST http://localhost:8001/runs/replay
```

Then we stopped and restarted the API and fetched the same run id:

```bash
curl http://localhost:8001/runs/<run-id>
```

### Fix
We added a SQLAlchemy-backed `RunRepository`. SQLAlchemy is a Python database toolkit that lets the app work with SQLite locally and Postgres in Docker or cloud environments.

The repository stores each run as a JSON payload in a database row. This keeps the first persistence version simple while preserving the complete run state: tasks, trace events, artifacts, metrics, and approval status.

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

The API restart smoke test confirmed that a created replay run survived process restart.

### How To Explain It
I moved run state from in-memory storage into a repository backed by SQLAlchemy. Locally the app can use SQLite for speed, while Docker Compose uses Postgres, which matches the production deployment direction. This shows that the agent workflow state survives API restarts, which is important for Kubernetes-based systems.

---

## Incident 013: Approval runs needed an explicit completion action

### Incident
Runs could pause at human approval, but there was no way to approve the artifact and complete the workflow outcome.

### Why It Matters
Human-in-the-loop approval is important for production AI systems. A human-in-the-loop step means the system pauses before a risky or visible action and waits for a person to review and approve it.

### Symptoms
The run board could reach `approval` status and show an approval artifact, but the only available control was still execution advancement.

### Root Cause
The first workflow state machine handled automated task progress but did not yet model the human decision that releases the outcome.

### Debugging Steps
We wrote failing API tests for:

```bash
POST /runs/{run_id}/approve
```

The tests first failed with `404 Not Found`, proving the approval endpoint did not exist. We then added the backend transition and verified the browser flow from an approval run.

### Fix
We added an approval endpoint and frontend approval action. When a run is waiting for approval, the UI now shows `Approve outcome`. Approving the run:

- Marks approval tasks as done.
- Marks approval artifacts as reviewed.
- Sets the run status to done.
- Adds an `approval_completed` trace event.
- Persists the completed run state in the database.

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

The browser test confirmed that `Approve outcome` moved the run to `Done` and displayed the `approval_completed` trace event.

### How To Explain It
I completed the human approval loop. The system can now create a run, execute agent steps, pause for review, and release the outcome only after approval. That is closer to how companies expect agentic systems to work in real operations, where auditability and control matter.

---

## Incident 014: Knowledge page needed real retrieval data

### Incident
The Knowledge page described document intelligence, but it did not yet read from a backend knowledge API or show retrieved chunks.

### Why It Matters
RAG means retrieval augmented generation. In simple terms, an AI system searches trusted documents first, then uses the retrieved evidence to produce a grounded answer. Companies care about this because agent outputs need citations and auditability.

### Symptoms
The page showed static cards for PDF, Markdown, and DOCX sources, but there was no searchable document index.

### Root Cause
The first UI focused on describing the capability. The backend needed a concrete retrieval contract before adding embeddings, pgvector, or LLM answer generation.

### Debugging Steps
We wrote failing tests for:

```bash
GET /knowledge/documents
GET /knowledge/search?query=<text>
```

The tests first failed with `404 Not Found`, proving no knowledge API existed. After adding lexical retrieval, one test expected a specific top chunk, but another chunk from the same support policy ranked higher. We changed the test to verify the correct document and citation family instead of overfitting to one chunk.

### Fix
We added seeded demo knowledge documents, backend schemas, a lexical retrieval module, API routes, and a dynamic Knowledge page that displays indexed sources and retrieval results with citations.

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

A route smoke test confirmed the Knowledge page renders the retrieval preview and support policy citation.

### How To Explain It
I added the first RAG contract without overbuilding. The system can list trusted documents and retrieve relevant chunks with citations. This gives the project a real document-intelligence foundation that can later be upgraded to embeddings and pgvector.

---

## Incident 015: Benchmark page needed real evaluation scores

### Incident
The Benchmarks page described quality, safety, cost, and traceability checks, but it displayed static numbers instead of scoring actual agent runs.

### Why It Matters
Agent systems need evaluation. Evaluation means measuring whether a run completed successfully, used citations, respected approval gates, stayed within cost limits, and produced enough trace data to debug.

### Symptoms
The page had fixed metrics such as scenarios and target success, but no backend benchmark report or run-level scorecard.

### Root Cause
The earlier product shell described observability and evaluation before the backend had enough run state to score. After adding run persistence, approval, traces, artifacts, and knowledge retrieval, there was enough data to build deterministic scoring.

### Debugging Steps
We wrote failing tests for:

```bash
GET /benchmarks
```

The tests first failed with `404 Not Found`, proving no benchmark API existed. After implementing the route, a local smoke check still returned `404` because the running API process had not been restarted with the new code. Restarting the local API loaded the route and the smoke check passed.

### Fix
We added a benchmark scoring module that evaluates each run across:

- Workflow success.
- Citation quality.
- Approval safety.
- Cost control.
- Traceability.

The Benchmarks page now reads the backend report and displays category averages plus recent run scores.

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

Route smoke checks confirmed `/benchmarks` returns a benchmark report and the Benchmarks page renders evaluation categories and recent run scores.

### How To Explain It
I added deterministic evaluation before adding LLM-as-judge. The system now scores real agent runs using transparent rules from run status, citations, approval traces, estimated cost, and observability data. This creates a reliable baseline that can later be extended with LLM judging.

---

## Incident 016: API needed readiness checks for orchestration

### Incident
The API had a `/health` endpoint, but it did not expose a readiness check that verifies database connectivity.

### Why It Matters
In Docker and Kubernetes, liveness and readiness mean different things. Liveness checks whether the process is alive. Readiness checks whether the service is ready to receive traffic. A database-backed API should not receive traffic until it can talk to its database.

### Symptoms
The API could start, but deployment manifests had no probes and Docker Compose could start the web service before the API and database were ready.

### Root Cause
The first deployment files were scaffolds. After adding database persistence, the deployment layer needed a readiness signal tied to storage.

### Debugging Steps
We wrote a failing test for:

```bash
GET /ready
```

The test first failed with `404 Not Found`. We then added a repository database ping and wired `/ready` to return the database check result.

### Fix
We added:

- `/ready` API endpoint.
- Database ping in the repository layer.
- Docker Compose health checks for API and Postgres.
- Docker Compose dependency conditions so web waits for a healthy API.
- Kubernetes readiness and liveness probes for the API deployment.

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

The local API smoke check confirmed `/ready` returns the database readiness payload.

### How To Explain It
I separated process health from traffic readiness. `/health` tells the orchestrator the API process is alive, while `/ready` proves the API can reach its database. That is important in Kubernetes because a pod can be running but still not ready to handle requests.

---

## Incident 017: Run execution needed worker-style job state

### Incident
Runs could be advanced manually from the run board, but there was no job object representing asynchronous worker execution.

### Why It Matters
Production agent systems usually do not perform every long-running action inside the web request. They enqueue work, process it in a worker, and expose job state so the UI can show whether work is queued, running, waiting for approval, completed, or failed.

### Symptoms
The run board had `Advance run`, but that represented a direct synchronous action instead of a queued worker process.

### Root Cause
The first orchestration slices focused on making state transitions visible. The next step was to introduce a worker-job contract without pulling in a full Redis worker yet.

### Debugging Steps
We wrote failing tests for:

```bash
POST /runs/{run_id}/jobs
GET /jobs/{job_id}
POST /jobs/{job_id}/tick
```

The tests first failed with `404 Not Found`, proving no worker job API existed. We then added an in-memory worker queue that wraps the existing run advancement logic.

### Fix
We added:

- Worker job schema.
- In-memory worker queue service.
- Job creation endpoint.
- Job detail endpoint.
- Worker tick endpoint.
- Run-board controls for queueing a job and running a worker step.

The worker pauses when a run reaches human approval, which mirrors real agent systems where a background job should not bypass approval gates.

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

Smoke checks confirmed the worker API advances a run and the run board renders worker controls.

### How To Explain It
I introduced a worker-job contract before adding a real Redis worker. The API can now queue a run, process it one step at a time, and expose job state to the UI. This is a production-oriented pattern because long-running agent execution should be observable and decoupled from normal web requests.

---

## Incident 018: Worker jobs disappeared after process restarts

### Incident
Worker jobs were stored in a Python dictionary, so restarting the API process erased every queued and running job.

### Why It Matters
Kubernetes regularly replaces pods during deployments, scaling, and failure recovery. Process memory belongs to one pod and is not durable, so operational state must live in a shared database that every replacement pod can reconnect to.

### Symptoms
A job could be created and advanced while one API process stayed alive, but a new process could not retrieve the job ID or its progress.

### Root Cause
The first worker slice intentionally established the API contract with an in-memory store. That store could not support multiple API replicas or survive restarts.

### Debugging Steps
We wrote tests that created a run and worker job in a temporary SQLite database, then constructed a new repository instance using the same database file. The tests initially failed because worker functions did not accept a repository and only read the process-local dictionary.

### Fix
We added a `worker_jobs` table and repository methods for saving and retrieving job payloads. Worker creation and every state transition now write to the database, and all run advancement uses the same injected repository.

### Verification
The persistence tests prove that both a newly queued job and its updated progress can be retrieved through a fresh repository instance.

```bash
pytest -q tests/test_worker_job_repository.py tests/test_worker_jobs.py
```

### How To Explain It
The database is the durable source of truth for job status. Redis will be used next as a fast delivery channel that tells workers which job to process, but Redis does not replace the database record. This separation lets jobs survive pod restarts while workers scale independently.

---

## Incident 019: Worker execution still depended on HTTP requests

### Incident
Worker jobs were durable, but a user still had to call a public `tick` endpoint for every execution step. Redis existed in Docker Compose but was not connected to the API or a worker process.

### Why It Matters
Long-running agent work should continue after the browser closes and should scale separately from web traffic. A queue lets the API accept work quickly while background worker replicas process it independently.

### Symptoms
The run board displayed `Run worker step`, there was no worker container or Kubernetes worker Deployment, and Redis carried no jobs.

### Root Cause
The earlier slice established job state and persistence before introducing an external queue. Execution was still synchronous and controlled by the UI.

### Debugging Steps
We wrote failing tests for four production behaviors:

- Creating a job dispatches only its database ID.
- One worker atomically claims a queued job.
- A duplicate queue delivery cannot execute the same run twice.
- Transient failures retry, but persistent failures stop after three attempts.

The tests initially failed because there was no dispatcher module, no worker entrypoint, no atomic claim method, and the public tick route was still active.

### Fix
We added Redis Queue (RQ) dispatch, a separate worker entrypoint, an atomic database claim, bounded retries, and durable failure details. The API now persists the job before publishing its ID, and it returns `503 Service Unavailable` if Redis cannot accept work. The manual tick route and UI control were replaced by job-status refresh.

Docker Compose now builds one Python image for both the API and worker. Kubernetes uses the same image in separate Deployments so each role can scale independently.

### Verification

```bash
pytest -q
npm run typecheck:web
npm run lint:web
docker compose config --quiet
```

### Remaining Production Risk
Database commit and Redis publish are still two separate operations. If the API process crashes between them, the database retains a queued job but Redis may never receive it. A later transactional-outbox or queued-job reconciliation process should automatically redispatch these orphaned jobs.

### How To Explain It
Postgres owns durable job state, Redis carries lightweight job IDs, and RQ workers perform execution outside HTTP requests. An atomic `queued` to `running` claim makes at-least-once queue delivery safe, while bounded retries prevent permanent failures from looping forever. I can also explain the remaining commit-to-publish gap and how an outbox pattern would close it.

---

## Incident 020: Containerized worker could not find demo data

### Incident
The API and worker image built successfully, but the first API container exited and the next RQ job failed because replay data was resolved from the source-tree depth.

### Why It Matters
Container filesystems and installed Python packages do not have the same directory layout as a development checkout. Runtime assets need an explicit, portable location instead of assumptions about how many parent directories exist.

### Symptoms
The first API startup failed with:

```text
IndexError: 3
```

After copying the repository-level `demo-data` directory into the image, the API started, but RQ's child process imported the installed wheel from `site-packages` and failed with:

```text
FileNotFoundError: /usr/local/lib/demo-data/replay-runs.json
```

### Root Cause
Both replay and knowledge loaders used `Path(__file__).resolve().parents[3]`. That happened to point at the repository root during local development, but it pointed somewhere else inside the built image and RQ child process.

### Debugging Steps
We inspected container logs at each boundary:

1. API import failed before database initialization, proving the first break was asset resolution.
2. After preserving the source-tree layout, API readiness passed and Redis consumed the job.
3. Worker logs showed RQ imported `app.worker` from `site-packages`, proving the child process had a different module path from the API process.
4. Redis queue length returned zero, confirming delivery succeeded and execution failed after dequeue.

### Fix
We added one `demo_data_path()` resolver shared by replay and knowledge loading. Local development searches parent directories for `demo-data`; containers set `DEMO_DATA_DIR=/workspace/demo-data` explicitly in the image. The Docker build copies the assets to that location, so API and worker child processes use the same path.

### Verification
The containerized smoke test created a run through the API, dispatched its job through Redis, and observed the worker persist this final state:

```text
job_status=waiting_for_approval
steps_completed=3
attempts=1
run_status=approval
trace_events=7
```

### How To Explain It
I traced a container-only failure across API import, Redis delivery, RQ child-process import, and database state. The fix replaced a source-layout assumption with explicit runtime configuration, which is the portable pattern for Docker and Kubernetes assets.
