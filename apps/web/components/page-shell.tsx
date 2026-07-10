import { SiteNav } from "./site-nav";

export function PageShell({
  title,
  eyebrow,
  description,
  children
}: {
  title: string;
  eyebrow: string;
  description: string;
  children: React.ReactNode;
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
        </div>
        {children}
      </section>
    </main>
  );
}

