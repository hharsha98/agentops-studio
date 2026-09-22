import Link from "next/link";
import { Boxes } from "lucide-react";

export function SiteNav() {
  return (
    <nav className="nav">
      <Link className="brand" href="/">
        <span className="brand-mark">
          <Boxes size={18} />
        </span>
        <span>AgentOps Studio</span>
      </Link>
      <div className="nav-links">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/workflows">Workflows</Link>
        <Link href="/runs">Runs</Link>
        <Link href="/knowledge">Knowledge</Link>
        <Link href="/mcp">MCP</Link>
        <Link href="/traces">Traces</Link>
        <Link href="/cloud">Deploy</Link>
      </div>
      <Link className="button primary" href="/dashboard">
        Live demo
      </Link>
    </nav>
  );
}
