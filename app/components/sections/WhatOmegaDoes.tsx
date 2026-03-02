import { LANDING_COPY } from "@/app/content/landing";

export default function WhatOmegaDoes() {
  const { whatItDoes } = LANDING_COPY;
  
  return (
    <section id="what" className="section">
      <div className="site-wrap">
        <div className="site-measure">
          <h2 className="h2">{whatItDoes.title}</h2>
          <p className="p-muted">{whatItDoes.intro}</p>
          <p className="p-muted">It supports humans to:</p>
          <ul className="ul">
            {whatItDoes.supports.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          <p className="p" style={{ whiteSpace: 'pre-line' }}>{whatItDoes.conclusion}</p>
        </div>
      </div>
    </section>
  );
}

