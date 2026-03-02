import { LANDING_COPY } from "@/app/content/landing";

export default function WhereUsed() {
  const { usedIn } = LANDING_COPY;
  
  return (
    <section id="used" className="section">
      <div className="site-wrap">
        <div className="site-measure">
          <h2 className="h2">{usedIn.title}</h2>
          <p className="p-muted">{usedIn.intro}</p>
          <ul className="ul">
            {usedIn.contexts.map((context, i) => (
              <li key={i}>{context}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

