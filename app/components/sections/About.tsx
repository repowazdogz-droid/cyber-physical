import { LANDING_COPY } from "@/app/content/landing";

export default function About() {
  const { about } = LANDING_COPY;
  
  return (
    <section id="about" className="section">
      <div className="site-wrap">
        <div className="site-measure">
          <h2 className="h2">{about.title}</h2>
          <p className="p">{about.intro}</p>
          <p className="p-muted">It prioritises:</p>
          <ul className="ul">
            {about.priorities.map((priority, i) => (
              <li key={i}>{priority}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

