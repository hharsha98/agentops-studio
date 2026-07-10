import { SiteFooter } from "./site-footer";
import { SiteNav } from "./site-nav";

export function PageShell({
  title,
  eyebrow,
  description,
  children,
  actions
}: {
  title: string;
  eyebrow: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <main className="shell">
      <SiteNav />
      <section className="page">
        <div className="page-title">
          <div>
            <div className="eyebrow">{eyebrow}</div>
            <h1>{title}</h1>
            <p className="hero-copy">{description}</p>
          </div>
          {actions ? <div className="page-actions">{actions}</div> : null}
        </div>
        {children}
      </section>
      <SiteFooter />
    </main>
  );
}
