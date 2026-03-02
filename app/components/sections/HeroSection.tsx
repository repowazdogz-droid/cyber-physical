import { LANDING_COPY, OMEGA_RC_URL, OMEGA_RC_IS_LIVE } from "@/app/content/landing";

export default function HeroSection() {
  const { hero } = LANDING_COPY;
  const isLive = OMEGA_RC_IS_LIVE;
  
  return (
    <section id="hero" className="section">
      <div className="site-wrap">
        <div className="site-measure">
          <h1 className="h1">{hero.title}</h1>
          <h2 className="h2">{hero.subtitle}</h2>
          <p className="p" style={{ whiteSpace: 'pre-line' }}>{hero.description}</p>
          <div className="btn-row">
            {isLive ? (
              <a 
                href={OMEGA_RC_URL}
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-primary"
              >
                {hero.actions.tryOmegaRc}
                <span className="sr-only">(opens in new tab)</span>
              </a>
            ) : (
              <button 
                disabled
                className="btn btn-primary"
                style={{ cursor: 'not-allowed', opacity: 0.6 }}
              >
                Omega-RC (coming soon)
              </button>
            )}
            <a href="#contact" className="btn">{hero.actions.contact}</a>
          </div>
          {!isLive && (
            <p className="note" style={{ marginTop: 'var(--s-2)' }}>Public release pending.</p>
          )}
          <p className="note">{hero.note}</p>
        </div>
      </div>
    </section>
  );
}

