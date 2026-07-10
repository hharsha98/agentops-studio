import Link from "next/link";
import { Boxes } from "lucide-react";

const FOOTER_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/workflows", label: "Workflows" },
  { href: "/runs", label: "Runs" },
  { href: "/agents", label: "Agents" },
  { href: "/cloud", label: "Deploy" },
  { href: "/design-preview", label: "Design preview" }
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <span className="brand-mark">
            <Boxes size={18} />
          </span>
          <div>
            <strong>AgentOps Studio</strong>
            <p>Multi-agent operations console for business teams.</p>
          </div>
        </div>
        <nav className="site-footer-links" aria-label="Footer">
          {FOOTER_LINKS.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="site-footer-bottom">
        <span>Built for portable Kubernetes deployment</span>
        <span>Cursor UI branch · demo-ready surface</span>
      </div>
    </footer>
  );
}
