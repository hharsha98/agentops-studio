export const cloudBadges = [
  "Orchestration",
  "FastAPI",
  "Postgres/pgvector",
  "Redis",
  "RAG",
  "MCP"
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
    text: "Scores demo runs for completeness, citations, and sandbox safety checks."
  },
  {
    icon: "cloud",
    title: "Deployment foundation",
    text: "Packages the system with Docker Compose, Kubernetes manifests, and Terraform blueprints."
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
    description: "Searches the web, extracts pages, cites sources, and prepares evidence packs.",
    accent: "green"
  },
  {
    name: "Knowledge Analyst",
    description: "Retrieves policy, product, finance, and operations context from the RAG memory layer.",
    accent: "amber"
  },
  {
    name: "Tool Operator",
    description: "Executes approved GitHub, Gmail, Slack, storage, and internal tool actions.",
    accent: "red"
  },
  {
    name: "Compliance Reviewer",
    description: "Checks workflow outputs against policy, risk rules, and approval requirements.",
    accent: "blue"
  },
  {
    name: "Workflow Evaluator",
    description: "Scores final artifacts against benchmarks, expected fields, citations, and cost limits.",
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
    text: "Specialist agents run as an ordered graph: research, retrieval, analysis, and drafting share one run context."
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
  "DAG Orchestrator",
  "Postgres",
  "pgvector-ready",
  "Redis-ready",
  "RAG citations",
  "SearXNG",
  "MCP tool registry",
  "Run traces",
  "Docker Compose",
  "Kubernetes",
  "Terraform blueprints"
];

export const workflowOutcomes = [
  {
    icon: "message",
    title: "Support triage",
    text: "Classify tickets, retrieve policy answers, draft Gmail replies, and escalate risky customer issues.",
    accent: "blue"
  },
  {
    icon: "briefcase",
    title: "Sales lead research",
    text: "Research companies, score fit, summarize buying signals, and prepare outreach drafts.",
    accent: "green"
  },
  {
    icon: "sparkles",
    title: "Marketing campaign",
    text: "Create campaign briefs, landing copy, content calendars, and launch checklists.",
    accent: "amber"
  },
  {
    icon: "receipt",
    title: "Finance invoice check",
    text: "Compare invoices against policy, flag anomalies, and generate approval memos.",
    accent: "red"
  },
  {
    icon: "users",
    title: "Hiring screen",
    text: "Compare CVs to role criteria, create candidate summaries, and draft follow-up emails.",
    accent: "blue"
  },
  {
    icon: "search",
    title: "Product research",
    text: "Analyze competitors, extract web sources, cite evidence, and recommend roadmap moves.",
    accent: "green"
  },
  {
    icon: "code",
    title: "Engineering delivery",
    text: "Convert requests into issues, branches, tests, and approved GitHub pull requests.",
    accent: "amber"
  },
  {
    icon: "shield",
    title: "Compliance review",
    text: "Check workflows and documents against company policy with traceable risk notes.",
    accent: "red"
  },
  {
    icon: "chart",
    title: "Investor update",
    text: "Summarize metrics, wins, risks, roadmap, and create an investor email draft.",
    accent: "blue"
  },
  {
    icon: "rocket",
    title: "Executive daily brief",
    text: "Summarize operating activity and post a Slack update after human approval.",
    accent: "green"
  }
];

export const privateActions = [
  { icon: "git", label: "GitHub PR after approval" },
  { icon: "mail", label: "Gmail drafts only" },
  { icon: "slack", label: "Slack post after approval" },
  { icon: "shield", label: "Audit log for all actions" },
  { icon: "brain", label: "FreeLLMAPI model gateway" },
  { icon: "code", label: "Sandbox repo automation" }
];

export const cloudTabs = [
  {
    name: "Local Docker",
    summary: "Fast development mode with frontend, API, Postgres, Redis, and optional SearXNG.",
    proof: "Use for daily development, testing, and the hiring-manager demo path."
  },
  {
    name: "Local Kubernetes",
    summary: "k3d cluster for pods, services, ingress, secrets, config maps, health checks, and rollout practice.",
    proof: "Use before managed environments so application and cluster issues are separated."
  },
  {
    name: "Managed Kubernetes",
    summary: "Production-style deployment path with Terraform blueprints, managed database, cache, secrets, ingress, and logs.",
    proof: "Use for short public launch windows and production-readiness validation."
  },
  {
    name: "Portable Hosting",
    summary: "Provider-neutral architecture that keeps application manifests portable and infrastructure details in Terraform.",
    proof: "Use for long-running hosting without locking the product to one vendor."
  }
];

export const workforceSquads = [
  {
    name: "Core Platform",
    agents: "6 agents",
    tools: "Routing, approvals, memory, benchmarks",
    accent: "blue"
  },
  {
    name: "Revenue",
    agents: "4 agents",
    tools: "Lead research, outreach, CRM-ready notes",
    accent: "green"
  },
  {
    name: "Product",
    agents: "4 agents",
    tools: "Competitors, roadmap, user insights",
    accent: "amber"
  },
  {
    name: "Engineering",
    agents: "4 agents",
    tools: "GitHub, tests, review, release notes",
    accent: "blue"
  },
  {
    name: "Operations",
    agents: "5 agents",
    tools: "Support, finance, hiring, executive briefs",
    accent: "green"
  },
  {
    name: "Risk",
    agents: "3 agents",
    tools: "Compliance, policy, audit evidence",
    accent: "red"
  }
];

export const builderCapabilities = [
  {
    icon: "bot",
    title: "Agent templates",
    text: "Create custom agents from safe templates with prompts, models, schemas, and memory sources."
  },
  {
    icon: "workflow",
    title: "Workflow nodes",
    text: "Compose agent, tool, RAG, approval, benchmark, and action nodes in a visual builder."
  },
  {
    icon: "network",
    title: "MCP registry",
    text: "Browse marketplace-style tools in sandbox mode and enable approved templates privately."
  },
  {
    icon: "database",
    title: "Knowledge sources",
    text: "Attach PDF, Markdown, and DOCX sources so every output can cite its evidence."
  }
];

export const proofMetrics = [
  { label: "Demo workflows", value: "4" },
  { label: "Specialist agents", value: "6" },
  { label: "MCP tools", value: "6" },
  { label: "Deploy paths", value: "4" }
];

export const deploymentProof = [
  {
    icon: "panel",
    title: "Local Docker",
    text: "Daily development stack with web, API, Postgres, Redis, and optional SearXNG research."
  },
  {
    icon: "boxes",
    title: "Local Kubernetes",
    text: "k3d path for pods, services, ingress, secrets, config maps, health checks, and rollout validation."
  },
  {
    icon: "cloud",
    title: "Managed Kubernetes",
    text: "Production-style cluster path with Terraform blueprints, managed database, cache, and centralized logs."
  },
  {
    icon: "cloud",
    title: "Portable Hosting",
    text: "Vendor-portable deployment model with reusable Kubernetes manifests and provider-specific infrastructure modules."
  }
];
