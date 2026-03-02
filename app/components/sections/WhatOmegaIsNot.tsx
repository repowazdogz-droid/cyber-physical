import { LANDING_COPY } from "@/app/content/landing";

export default function WhatOmegaIsNot() {
  const { whatItIsNot } = LANDING_COPY;
  
  return (
    <section id="not" className="section">
      <div className="site-wrap">
        <div className="site-measure">
          <h2 className="h2">{whatItIsNot.title}</h2>
          <p className="p-muted">{whatItIsNot.intro}</p>
          <ul className="ul">
            {whatItIsNot.nots.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          <p className="p">{whatItIsNot.conclusion}</p>
        </div>
      </div>
    </section>
  );
}

