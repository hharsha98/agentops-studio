import Link from "next/link";
import { Boxes } from "lucide-react";

const LINKS = [
  ["/dashboard", "Dashboard"],
  ["/workflows", "Workflows"],
  ["/runs", "Runs"],
  ["/knowledge", "Knowledge"],
  ["/mcp", "MCP"],
  ["/traces", "Traces"],
  ["/cloud", "Deploy"]
] as const;

export function SiteNav() {
  return (
    <header className="topbar">
      <Link className="brand" href="/">
        <span className="brand-mark">
          <Boxes size={16} />
        </span>
        <span>
          AgentOps
          <small>Studio</small>
        </span>
      </Link>
      <nav className="top-links" aria-label="Primary">
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
      </nav>
      <Link className="button primary" href="/dashboard">
        Open console
      </Link>
    </header>
  );
}
