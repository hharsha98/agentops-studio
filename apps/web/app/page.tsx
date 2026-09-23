import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { LiveStatus } from "@/components/live-status";

const tiles = [
  {
    href: "/dashboard",
    kicker: "Console",
    title: "Dashboard",
    text: "Start a multi-agent run, approve a waiting brief, and see gateway status."
  },
  {
    href: "/workflows",
    kicker: "DAGs",
    title: "Workflows",
    text: "Executive brief, support triage, product research, and compliance review."
  },
  {
    href: "/runs",
    kicker: "Board",
    title: "Runs",
    text: "Backlog, running, approval, failed, and done. Open any card for the artifact."
  },
  {
    href: "/knowledge",
    kicker: "RAG",
    title: "Knowledge",
    text: "Search seeded policies and open a document’s chunks with scores."
  },
  {
    href: "/mcp",
    kicker: "Tools",
    title: "MCP",
    text: "Invoke knowledge search, web search, and sandbox Slack, Gmail, and GitHub."
  },
  {
    href: "/traces",
    kicker: "Spans",
    title: "Traces",
    text: "Filter spans by run. Model calls show up when OmniRoute is configured."
  },
  {
    href: "/builder",
    kicker: "Intake",
    title: "Builder",
    text: "Pick a workflow, write a goal, and start the run from one form."
  },
  {
    href: "/research",
    kicker: "Search",
    title: "Research",
    text: "Call the same web_search tool the research agent uses."
  },
  {
    href: "/cloud",
    kicker: "Host",
    title: "Deploy",
    text: "Contabo ports, Caddy, systemd, and the OmniRoute env file. Not Agent Fleet."
  }
];

export default function HomePage() {
  return (
    <div className="home">
      <SiteNav />
      <main>
        <section className="home-hero">
          <p className="kicker">AgentOps Studio</p>
          <h1>Operations console for multi-agent work.</h1>
          <p className="lede">
            Specialist runs, cited knowledge, sandbox tools, approvals, and traces. This host is
            AgentOps Studio at agentops.169.58.185.43.sslip.io. Agent Fleet stays on its own host.
            Model calls use OmniRoute when the API has a key.
          </p>
          <div className="row">
            <Link className="button primary" href="/dashboard">
              Open console
            </Link>
            <Link className="button" href="/workflows">
              Start a workflow
            </Link>
            <Link className="button" href="/runs">
              Review runs
            </Link>
          </div>
          <LiveStatus />
        </section>
        <section className="tile-grid" aria-label="Product areas">
          {tiles.map((tile) => (
            <Link className="tile" href={tile.href} key={tile.href}>
              <span className="kicker">{tile.kicker}</span>
              <h2>{tile.title}</h2>
              <p>{tile.text}</p>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
