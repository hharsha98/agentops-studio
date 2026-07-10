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
  specializedAgents,
  techStack,
  workflowOutcomes
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
          <div className="eyebrow">Multi-agent orchestration console</div>
          <h1>Run agent workforces from goal to approved outcome.</h1>
          <p className="hero-copy">
            AgentOps Studio coordinates specialist agents, RAG memory, MCP tool servers, approval gates,
            Langfuse traces, benchmark checks, and Kubernetes-ready deployment from one operations workspace.
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
            <span className="live-pill">Streaming</span>
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
                Created 6-step DAG. Assigning research, retrieval, analysis, compliance, and brief agents.
              </div>
              <div className="chat-message agent">
                <span>Research Agent</span>
                SearXNG and Firecrawl completed. 8 sources extracted, 6 citations attached.
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
              <div className="inspector-row"><span>Trace</span><strong>24 events</strong></div>
              <div className="inspector-row"><span>Tools</span><strong>7 calls</strong></div>
              <div className="inspector-row"><span>Tokens</span><strong>18.4k</strong></div>
              <div className="inspector-row warning"><span>Approval</span><strong>Slack post</strong></div>
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
          <h2>Everything required to operate production-grade agent systems.</h2>
          <p className="section-lead">
            The platform is organized around the responsibilities AI engineers are expected to own:
            orchestration, tools, memory, evaluation, observability, approvals, and deployment.
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
            A user goal becomes a dependency graph. Agents run in parallel where possible, pause for human
            approval when needed, and produce evidence-backed artifacts.
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
          <h2>10 workflows that create reviewable artifacts.</h2>
          <p className="section-lead">
            The outcomes are designed to be visible and inspectable: reports, drafts, decision memos,
            dashboards, pull requests, approval notes, and leadership briefs.
          </p>
        </div>
        <div className="outcome-grid">
          {workflowOutcomes.map((outcome, index) => {
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
          <h2>Ground every agent answer in retrieved evidence.</h2>
          <p>
            SearXNG handles private search, Firecrawl extracts clean page content, and pgvector retrieves
            document chunks so outputs can include citations instead of unsupported claims.
          </p>
          <div className="source-list">
            {["SearXNG search", "Firecrawl extraction", "PDF/DOCX chunks", "pgvector retrieval", "Citation audit"].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
        <div className="trace-panel">
          <div className="trace-row"><span>01</span><strong>Query planned</strong><small>Market, customer, and internal context</small></div>
          <div className="trace-row"><span>02</span><strong>Sources extracted</strong><small>8 web pages, 12 document chunks</small></div>
          <div className="trace-row"><span>03</span><strong>Claims checked</strong><small>Confidence notes and citation map</small></div>
          <div className="trace-row"><span>04</span><strong>Artifact generated</strong><small>Brief with 6 linked citations</small></div>
        </div>
      </section>

      <section className="section section-band">
        <div className="section-heading compact">
          <span className="section-kicker">Runtime builder and MCP</span>
          <h2>Configure agents, tools, schemas, and approval rules without redeploying.</h2>
          <p className="section-lead">
            The builder separates public-safe previews from private execution. Real tool calls require
            credentials, explicit permissions, schemas, tests, and audit logging.
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
          <h2>A stack that maps to modern AI engineering work.</h2>
          <p className="section-lead">
            The stack demonstrates agent orchestration, API design, vector retrieval, background state,
            observability, local containers, and Kubernetes-based deployment readiness.
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
          <h2>Debug agent behavior with traces, benchmarks, and cost controls.</h2>
          <p>
            The platform surfaces prompt history, model calls, tool calls, retrieved context, approval decisions,
            generated artifacts, errors, token estimates, and benchmark results.
          </p>
        </div>
        <div className="proof-cards">
          <article>
            <RadioTower size={22} />
            <strong>Langfuse traces</strong>
            <span>Prompt, model, tool, output, retry, and error history.</span>
          </article>
          <article>
            <CircleDollarSign size={22} />
            <strong>Cost controls</strong>
            <span>Token estimates, model routing, and infrastructure awareness.</span>
          </article>
          <article>
            <Gauge size={22} />
            <strong>50 benchmarks</strong>
            <span>Quality, speed, citation, approval safety, and workflow success.</span>
          </article>
        </div>
      </section>

      <section className="section final-cta">
        <span className="section-kicker">AgentOps Studio</span>
        <h2>A complete multi-agent platform surface, ready for the real engine.</h2>
        <p>
          The frontend now presents the product as an AI operations console: agents, graphs, tools, memory,
          traces, evaluations, approvals, and deployable infrastructure in one coherent platform.
        </p>
        <div className="hero-actions">
          <Link className="button primary" href="/dashboard">Open dashboard</Link>
          <Link className="button" href="/cloud">Review deployment plan</Link>
        </div>
      </section>
    </main>
  );
}
