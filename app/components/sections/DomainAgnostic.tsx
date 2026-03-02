import { LANDING_COPY } from "@/app/content/landing";

export default function DomainAgnostic() {
  const { domainAgnostic } = LANDING_COPY;
  
  return (
    <section id="domain" className="section">
      <div className="site-wrap">
        <div className="site-measure">
          <h2 className="h2">{domainAgnostic.title}</h2>
          <p className="p-muted">{domainAgnostic.intro}</p>
          
          <p className="p-muted">It does not embed:</p>
          <ul className="ul">
            {domainAgnostic.doesNotEmbed.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          
          <p className="p-muted">Instead, it provides:</p>
          <ul className="ul">
            {domainAgnostic.provides.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          
          <p className="p" style={{ whiteSpace: 'pre-line' }}>{domainAgnostic.note}</p>
        </div>
      </div>
    </section>
  );
}

