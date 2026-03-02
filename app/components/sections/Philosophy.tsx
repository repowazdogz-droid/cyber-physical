import { LANDING_COPY } from "@/app/content/landing";

export default function Philosophy() {
  const { philosophy } = LANDING_COPY;
  
  return (
    <section id="philosophy" className="section" style={{ paddingTop: 'var(--s-9)' }}>
      <div className="site-wrap">
        <div className="site-measure">
          <h2 className="h2">{philosophy.title}</h2>
          <p className="p-muted">Most AI systems optimise for:</p>
          <ul className="ul">
            {philosophy.mostAi.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          <p className="p-muted">OMEGA optimises for:</p>
          <ul className="ul">
            {philosophy.omega.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          <p className="p">{philosophy.conclusion}</p>
        </div>
      </div>
    </section>
  );
}

