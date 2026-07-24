"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, Menu, X } from "lucide-react";
import { useState } from "react";

import { StatusBadge } from "./status-badge";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/workflows", label: "Workflows" },
  { href: "/agents", label: "Agents" },
  { href: "/builder", label: "Builder" },
  { href: "/cloud", label: "Deploy" }
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="nav">
      <Link className="brand" href="/" onClick={() => setOpen(false)}>
        <span className="brand-mark">
          <Boxes size={18} />
        </span>
        <span>AgentOps Studio</span>
      </Link>

      <div className="nav-center">
        <StatusBadge status="online" label="6 agents online" />
        <div className={`nav-links ${open ? "open" : ""}`}>
          {NAV_LINKS.map((link) => (
            <Link
              className={pathname === link.href || pathname.startsWith(`${link.href}/`) ? "active" : ""}
              href={link.href}
              key={link.href}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            className={`mobile-only ${pathname === "/design-preview" ? "active" : ""}`}
            href="/design-preview"
            onClick={() => setOpen(false)}
          >
            Design preview
          </Link>
        </div>
      </div>

      <div className="nav-actions">
        <Link className="button ghost desktop-only" href="/design-preview">
          Accent colors
        </Link>
        <Link className="button primary" href="/dashboard">
          Open console
        </Link>
        <button
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="nav-toggle"
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
    </nav>
  );
}
