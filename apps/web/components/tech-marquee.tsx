import { techStack } from "@/lib/platform-data";

export function TechMarquee() {
  const items = [...techStack, ...techStack];

  return (
    <div className="tech-marquee" aria-label="Technology stack">
      <div className="tech-marquee-track">
        {items.map((item, index) => (
          <span className="tech-marquee-item" key={`${item}-${index}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
