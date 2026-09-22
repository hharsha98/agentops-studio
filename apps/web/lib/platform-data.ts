export const cloudBadges = [
  "Orchestration",
  "FastAPI",
  "TF-IDF RAG",
  "MCP sandbox",
  "Run traces",
  "Approval gates"
];

export const featureCards = [
  {
    icon: "bot",
    title: "Orchestrator router",
    text: "Routes goals to specialist agents, merges their findings, and keeps each run aligned to the requested outcome."
  },
  {
    icon: "workflow",
    title: "DAG workflow engine",
    text: "Breaks complex work into ordered specialist steps with shared context, citations, and approval gates."
  },
  {
    icon: "layers",
    title: "Kanban execution board",
    text: "Turns every run into visible tasks with backlog, running, approval, failed, and done states."
  },
  {
    icon: "search",
    title: "Research and citations",
    text: "Combines sandbox web search, document retrieval, and source-linked answers."
  },
  {
    icon: "file",
    title: "RAG memory layer",
    text: "Indexes policies, playbooks, and runbooks into retrievable chunks with citations."
  },
  {
    icon: "boxes",
    title: "MCP tool registry",
    text: "Connects tool handlers through permissioned templates, schemas, and sandbox invoke."
  },
  {
    icon: "activity",
    title: "Trace waterfall",
    text: "Shows agent steps, tool calls, RAG hits, artifacts, and approvals in one timeline."
  },
  {
    icon: "chart",
    title: "Evaluation scorecard",
    text: "Each demo run records a deterministic scorecard for completeness, citations, and sandbox safety. There is no separate benchmark suite."
  },
  {
    icon: "cloud",
    title: "Public demo hosting",
    text: "Native Node and Python on ports 3010 and 8010, behind Caddy. Compose and Kubernetes docs stay optional."
  }
];

export const specializedAgents = [
  {
    name: "Orchestrator",
    description: "Plans the run, delegates work, resolves dependencies, and synthesizes final outputs.",
    accent: "blue"
  },
  {
    name: "Deep Research",
    description: "Calls sandbox web search. SearXNG is optional; otherwise the tool returns a deterministic demo fallback.",
    accent: "green"
  },
  {
    name: "Knowledge Analyst",
    description: "Retrieves policy, product, finance, and operations context from the RAG memory layer.",
    accent: "amber"
  },
  {
    name: "Tool Operator",
    description: "Prepares sandbox Gmail and Slack drafts. The public demo never sends real mail, Slack, or GitHub writes.",
    accent: "red"
  },
  {
    name: "Compliance Reviewer",
    description: "Checks workflow outputs against policy, risk rules, and approval requirements.",
    accent: "blue"
  },
  {
    name: "Workflow Evaluator",
    description: "Attaches a deterministic scorecard for completeness, citations, sandbox safety, and offline cost.",
    accent: "green"
  }
];

export const executionStages = [
  {
    step: "01",
    title: "Goal intake",
    text: "The orchestrator turns a business goal into a structured run plan with constraints, expected artifacts, and success checks."
  },
  {
    step: "02",
    title: "Agent graph",
    text: "Specialist agents run in a fixed order and share one run context: plan, retrieval, research, compliance, and drafting."
  },
  {
    step: "03",
    title: "Tool and memory",
    text: "Agents call MCP tools, query RAG memory, collect citations, and attach every tool result to the run trace."
  },
  {
    step: "04",
    title: "Approval and artifact",
    text: "Risky actions pause for human approval, then the system produces a cited brief or sandbox draft."
  }
];

export const techStack = [
  "Next.js 16",
  "React 19",
  "FastAPI",
  "Deterministic DAG",
  "TF-IDF RAG",
  "MCP sandbox",
  "Internal traces",
  "Caddy",
  "Docker Compose (optional)",
  "Kubernetes docs",
  "Terraform blueprints"
];

export const cloudTabs = [
  {
    name: "Contabo public demo",
    summary: "Native API :8010 and web :3010 behind Caddy at agentops.169.58.185.43.sslip.io. Not Agent Fleet.",
    proof: "systemd units plus scripts/prod-api.sh and scripts/prod-web.sh. Fleet stays on 8000/3002; RAG stays on 8402."
  },
  {
    name: "Native local dev",
    summary: "Hot-reload API :8000 and web :3000 via scripts/dev-api.sh and npm run dev:web.",
    proof: "Same DEMO_PUBLIC seed and /api proxy. No Docker required."
  },
  {
    name: "Docker Compose (optional)",
    summary: "Host ports 3010 and 8010 so Compose does not take Fleet's 8000/3002. Postgres, Redis, and SearXNG are profiles.",
    proof: "Useful on a machine that already has Docker. Not the Contabo path and not required to verify the demo."
  },
  {
    name: "Kubernetes docs",
    summary: "k3d and manifest notes for practice. Cluster-internal ports stay 3000/8000; they are not the Contabo host ports.",
    proof: "Scaffolding only. The public demo does not require a cluster."
  },
  {
    name: "Terraform blueprints",
    summary: "README-only AWS/GCP notes. There are no .tf files and no managed database in this demo.",
    proof: "Read infra/terraform when planning a later cloud move. Do not treat it as a live provisioner."
  }
];

export const builderCapabilities = [
  {
    icon: "workflow",
    title: "Runnable workflows",
    text: "Four specialist DAGs are live: executive brief, support triage, product research, and compliance review."
  },
  {
    icon: "network",
    title: "MCP sandbox registry",
    text: "Invoke knowledge search, web search, and sandbox Slack, Gmail, and GitHub handlers. Nothing is sent externally."
  },
  {
    icon: "database",
    title: "Seeded knowledge",
    text: "Markdown policies and runbooks are indexed at startup. Queries return cited chunks."
  },
  {
    icon: "shield",
    title: "Approval gates",
    text: "External-style actions pause until you approve. Approval records a sandbox Slack post only."
  }
];

export const proofMetrics = [
  { label: "Demo workflows", value: "4" },
  { label: "Specialist agents", value: "6" },
  { label: "MCP tools", value: "6" },
  { label: "Knowledge docs", value: "4" }
];

export const runnableWorkflows = [
  {
    icon: "rocket",
    title: "Executive daily brief",
    text: "Cite support and ops docs, draft a Slack brief, and wait for approval. Seeded on first visit.",
    accent: "green"
  },
  {
    icon: "message",
    title: "Support triage",
    text: "Retrieve the refund policy and draft a careful reply. Approval required before the sandbox action.",
    accent: "blue"
  },
  {
    icon: "search",
    title: "Product research",
    text: "Combine RAG playbooks with sandbox web research into a cited memo. Completes without an approval gate.",
    accent: "amber"
  },
  {
    icon: "shield",
    title: "Compliance review",
    text: "Check a proposed action against policy docs and return a risk note with citations.",
    accent: "red"
  }
];

export const deploymentProof = [
  {
    icon: "panel",
    title: "Contabo public demo",
    text: "Native Node + Python. Web :3010, API :8010, Caddy TLS on agentops.169.58.185.43.sslip.io. Distinct from Agent Fleet."
  },
  {
    icon: "boxes",
    title: "Native local dev",
    text: "Hot reload with scripts/dev-api.sh (:8000) and npm run dev:web (:3000). No Docker required."
  },
  {
    icon: "cloud",
    title: "Compose (optional)",
    text: "Same host ports 3010/8010 when Docker is available. Postgres, Redis, and SearXNG are optional profiles, not the live demo."
  },
  {
    icon: "cloud",
    title: "Cluster docs only",
    text: "k3d manifests and Terraform READMEs are scaffolding. They do not provision the public demo."
  }
];
