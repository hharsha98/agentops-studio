"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookOpen,
  Boxes,
  ClipboardCheck,
  Cloud,
  Cpu,
  FlaskConical,
  LayoutDashboard,
  PenLine,
  Search,
  Workflow
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workflows", label: "Workflows", icon: Workflow },
  { href: "/runs", label: "Runs", icon: Activity },
  { href: "/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/mcp", label: "MCP", icon: Cpu },
  { href: "/traces", label: "Traces", icon: ClipboardCheck },
  { href: "/agents", label: "Agents", icon: Boxes },
  { href: "/builder", label: "Builder", icon: PenLine },
  { href: "/research", label: "Research", icon: Search },
  { href: "/benchmarks", label: "Scorecards", icon: FlaskConical },
  { href: "/cloud", label: "Deploy", icon: Cloud }
];

export function SideNav() {
  const pathname = usePathname();
  return (
    <aside className="side">
      <Link className="brand" href="/">
        <span className="brand-mark">
          <Boxes size={16} />
        </span>
        <span>
          AgentOps
          <small>Studio</small>
        </span>
      </Link>
      <nav className="side-links" aria-label="Product">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "side-link active" : "side-link"}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function PageShell({
  title,
  eyebrow,
  description,
  children
}: {
  title: string;
  eyebrow: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <SideNav />
      <main className="app-main">
        <header className="page-head">
          <p className="kicker">{eyebrow}</p>
          <h1>{title}</h1>
          {description ? <p className="lede">{description}</p> : null}
        </header>
        <div className="page-body">{children}</div>
      </main>
    </div>
  );
}
