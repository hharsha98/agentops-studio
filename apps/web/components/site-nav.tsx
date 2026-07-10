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
        <Link href="/builder">Builder</Link>
        <Link href="/cloud">Deploy</Link>
      </div>
      <Link className="button primary" href="/dashboard">
        View demo
      </Link>
    </nav>
  );
}
