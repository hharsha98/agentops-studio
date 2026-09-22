import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  Boxes,
  Brain,
  BriefcaseBusiness,
  CircleDollarSign,
  Cloud,
  Code2,
  Database,
  FileText,
  Gauge,
  GitPullRequest,
  Layers3,
  Mail,
  MessageSquareText,
  Network,
  PanelTop,
  RadioTower,
  ReceiptText,
  Rocket,
  Search,
  ShieldCheck,
  Slack,
  Sparkles,
  UsersRound,
  Workflow
} from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import {
  builderCapabilities,
  cloudBadges,
  deploymentProof,
  executionStages,
  featureCards,
  proofMetrics,
  runnableWorkflows,
  specializedAgents,
  techStack
} from "@/lib/platform-data";

const iconMap = {
  activity: Activity,
  boxes: Boxes,
  bot: Bot,
  brain: Brain,
  briefcase: BriefcaseBusiness,
  chart: BarChart3,
  cloud: Cloud,
  code: Code2,
  database: Database,
  file: FileText,
  git: GitPullRequest,
  layers: Layers3,
  mail: Mail,
  message: MessageSquareText,
  network: Network,
  panel: PanelTop,
  receipt: ReceiptText,
  rocket: Rocket,
  search: Search,
  shield: ShieldCheck,
  slack: Slack,
  sparkles: Sparkles,
  users: UsersRound,
  workflow: Workflow
};

function getIcon(name: string) {
  return iconMap[name as keyof typeof iconMap] ?? Boxes;
}

export default function HomePage() {
  return (
    <main className="shell">
      <SiteNav />

      <section className="hero agent-hero">
        <div className="hero-content">
          <div className="eyebrow">AgentOps Studio · portable multi-agent ops lab</div>
          <h1>Run agent workforces from goal to approved outcome.</h1>
          <p className="hero-copy">
            Coordinate specialist agents, cited RAG, an MCP sandbox, approval gates, and run traces.
            The public demo is native Node and Python behind Caddy. Compose and Kubernetes notes stay
            optional. This is AgentOps Studio, not the Contabo Agent Fleet product.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/dashboard">
              Open operations console <ArrowRight size={16} />
            </Link>
            <Link className="button" href="/workflows">
              View workflow runtime
            </Link>
          </div>
          <div className="badges">
            {cloudBadges.map((badge) => (
              <span className="badge" key={badge}>{badge}</span>
            ))}
          </div>
          <div className="proof-strip">
            {proofMetrics.map((metric) => (
              <div className="proof-item" key={metric.label}>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ops-console" aria-label="AgentOps Studio runtime preview">
          <div className="console-top">
            <div>
              <span className="status-dot" />
              <strong>Run AO-204</strong>
              <small>Executive daily brief</small>
            </div>
              <span className="live-pill">Preview</span>
          </div>
          <div className="ops-grid">
            <div className="chat-stream">
              <div className="panel-label">Orchestrator chat</div>
              <div className="chat-message operator">
                <span>Operator</span>
                Summarize support risk, revenue signals, product blockers, and hiring updates for leadership.
              </div>
              <div className="chat-message agent">
                <span>Orchestrator</span>
                Planned a specialist DAG: knowledge, research, compliance, then a sandbox brief.
              </div>
              <div className="chat-message agent">
                <span>Knowledge Analyst</span>
                Retrieved cited policy chunks. Web search used the offline demo fallback.
              </div>
            </div>

            <div className="dag-runtime">
              <div className="panel-label">Agent execution graph</div>
              <svg className="dag-lines" viewBox="0 0 520 300" aria-hidden="true">
                <path d="M90 70 C150 70 170 110 230 110" />
                <path d="M90 70 C150 70 170 190 230 190" />
                <path d="M300 110 C350 112 370 150 430 150" />
                <path d="M300 190 C350 188 370 150 430 150" />
                <path d="M430 150 C462 150 474 214 482 242" />
              </svg>
              <div className="dag-node intake">Goal</div>
              <div className="dag-node research">Research</div>
              <div className="dag-node memory">RAG</div>
              <div className="dag-node draft">Brief</div>
              <div className="dag-node approval">Approval</div>
            </div>

            <div className="run-inspector">
              <div className="panel-label">Run inspector</div>
              <div className="inspector-row"><span>Trace</span><strong>Live spans</strong></div>
              <div className="inspector-row"><span>Tools</span><strong>MCP sandbox</strong></div>
              <div className="inspector-row"><span>Mode</span><strong>Deterministic</strong></div>
              <div className="inspector-row warning"><span>Approval</span><strong>Slack draft</strong></div>
            </div>

            <div className="mini-board">
              {["Backlog", "Running", "Approval", "Done"].map((lane, index) => (
                <div className="mini-board-lane" key={lane}>
                  <span>{lane}</span>
                  <strong>{index + 1}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section section-band">
        <div className="section-heading">
          <span className="section-kicker">Runtime architecture</span>
          <h2>What this demo actually runs.</h2>
          <p className="section-lead">
            Orchestration, sandbox tools, cited retrieval, approval gates, traces, and a native
            public-host path. Optional Compose and cluster notes are labeled as scaffolding.
          </p>
        </div>
        <div className="feature-mosaic">
          {featureCards.map((feature, index) => {
            const Icon = getIcon(feature.icon);
            return (
              <article className={`feature-tile tile-${index % 4}`} key={feature.title}>
                <div className="icon-box">
                  <Icon size={22} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="section-heading compact">
          <span className="section-kicker">Specialized agents</span>
          <h2>A workforce model built around real operating roles.</h2>
          <p className="section-lead">
            Each agent has a defined responsibility, permitted tools, memory sources, output schema, and traceable handoff.
          </p>
        </div>
        <div className="agent-roster">
          {specializedAgents.map((agent) => (
            <article className={`agent-card accent-${agent.accent}`} key={agent.name}>
              <Bot size={20} />
              <h3>{agent.name}</h3>
              <p>{agent.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section execution-section">
        <div className="execution-copy">
          <span className="section-kicker">Workflow execution</span>
          <h2>Goal in. Agent graph out. Every step observable.</h2>
          <p className="section-lead">
            A user goal becomes an ordered specialist run. Agents execute one after another, pause for
            human approval when the workflow requires it, and produce evidence-backed artifacts.
          </p>
        </div>
        <div className="execution-grid">
          {executionStages.map((stage) => (
            <article className="execution-card" key={stage.step}>
              <span>{stage.step}</span>
              <h3>{stage.title}</h3>
              <p>{stage.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading compact">
          <span className="section-kicker">Business workflows</span>
          <h2>Four workflows you can run in this demo.</h2>
          <p className="section-lead">
            Each one is a live specialist DAG. Start it from Workflows or the Dashboard. Other business
            workflows are not wired up here.
          </p>
        </div>
        <div className="outcome-grid">
          {runnableWorkflows.map((outcome, index) => {
            const Icon = getIcon(outcome.icon);
            return (
              <article className={`outcome-card accent-${outcome.accent}`} key={outcome.title}>
                <div className="outcome-top">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <Icon size={20} />
                </div>
                <h3>{outcome.title}</h3>
                <p>{outcome.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section split-section">
        <div className="panel-large intelligence-panel">
          <span className="section-kicker">Research and RAG</span>
          <h2>Ground answers in the seeded knowledge base.</h2>
          <p>
            Retrieval is TF-IDF over the markdown in demo-data/knowledge. Citations are attached to
            workflow steps. SearXNG is optional; without it, web search returns a deterministic
            fallback. Firecrawl and pgvector are not running.
          </p>
          <div className="source-list">
            {["Seeded markdown", "TF-IDF chunks", "Citation excerpts", "Sandbox web fallback", "Optional SearXNG"].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
        <div className="trace-panel">
          <div className="trace-row"><span>01</span><strong>Goal planned</strong><small>Orchestrator picks the specialist order</small></div>
          <div className="trace-row"><span>02</span><strong>Knowledge retrieved</strong><small>Cited chunks from the seeded markdown</small></div>
          <div className="trace-row"><span>03</span><strong>Sandbox tools</strong><small>Web search fallback and draft actions</small></div>
          <div className="trace-row"><span>04</span><strong>Artifact ready</strong><small>Brief or memo, approval when the workflow requires it</small></div>
        </div>
      </section>

      <section className="section section-band">
        <div className="section-heading compact">
          <span className="section-kicker">Runtime builder and MCP</span>
          <h2>Workflows, tools, knowledge, and approvals are already wired.</h2>
          <p className="section-lead">
            A visual builder is not part of this demo. Change behavior by running the live workflows,
            querying knowledge, and invoking sandbox MCP tools.
          </p>
        </div>
        <div className="builder-grid">
          {builderCapabilities.map((capability) => {
            const Icon = getIcon(capability.icon);
            return (
              <article className="builder-card" key={capability.title}>
                <Icon size={22} />
                <h3>{capability.title}</h3>
                <p>{capability.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section tech-section">
        <div className="section-heading">
          <span className="section-kicker">Built with</span>
          <h2>The stack behind the public demo.</h2>
          <p className="section-lead">
            Next.js and FastAPI run the demo natively. Vector databases, Redis, and Kubernetes are
            documented options, not services this host depends on.
          </p>
        </div>
        <div className="tech-strip">
          {techStack.map((item) => (
            <span className="tech-chip" key={item}>{item}</span>
          ))}
        </div>
        <div className="cloud-grid">
          {deploymentProof.map((item) => {
            const Icon = getIcon(item.icon);
            return (
              <article className="cloud-card" key={item.title}>
                <Icon size={22} />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section proof-section">
        <div className="proof-panel">
          <span className="section-kicker">Observability and evaluation</span>
          <h2>Debug a run from its own spans.</h2>
          <p>
            Every orchestrator, agent, tool, RAG, and approval step is stored on the run. The demo
            does not export those spans to Langfuse, and it does not run a separate benchmark suite.
          </p>
        </div>
        <div className="proof-cards">
          <article>
            <RadioTower size={22} />
            <strong>Internal traces</strong>
            <span>Agent, tool, RAG, artifact, and approval spans on the Traces page.</span>
          </article>
          <article>
            <CircleDollarSign size={22} />
            <strong>Offline cost</strong>
            <span>Deterministic studio mode. No paid model call is required.</span>
          </article>
          <article>
            <Gauge size={22} />
            <strong>Per-run checks</strong>
            <span>Completeness, citations, and sandbox safety on the workflows that include an evaluator.</span>
          </article>
        </div>
      </section>

      <section className="section final-cta">
        <span className="section-kicker">AgentOps Studio</span>
        <h2>Open the console and approve a seeded run.</h2>
        <p>
          Dashboard, Workflows, Runs, Knowledge, MCP, and Traces talk to the API. The first visit
          already has a cited executive brief waiting for sandbox approval.
        </p>
        <div className="hero-actions">
          <Link className="button primary" href="/dashboard">Open dashboard</Link>
          <Link className="button" href="/cloud">Review deployment plan</Link>
        </div>
      </section>
    </main>
  );
}
