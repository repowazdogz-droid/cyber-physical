import { LANDING_COPY, OMEGA_RC_URL, OMEGA_RC_IS_LIVE } from "@/app/content/landing";

export default function Products() {
  const { products } = LANDING_COPY;
  const isLive = OMEGA_RC_IS_LIVE;
  
  return (
    <section id="products" className="section" style={{ paddingTop: 'var(--s-9)' }}>
      <div className="site-wrap">
        <div className="site-measure">
          <h2 className="h2">{products.title}</h2>
          
          <div className="card" style={{ marginTop: 'var(--s-5)' }}>
            <h3 className="h2" style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--s-3)' }}>{products.omegaRc.name}</h3>
            <p className="p-muted">{products.omegaRc.subtitle}</p>
            <p className="p-muted">Omega-RC supports humans to:</p>
            <ul className="ul">
              {products.omegaRc.supports.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <div style={{ marginTop: 'var(--s-3)' }}>
              {isLive ? (
                <a 
                  href={OMEGA_RC_URL}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  {products.omegaRc.action}
                  <span className="sr-only">(opens in new tab)</span>
                </a>
              ) : (
                <>
                  <button 
                    disabled
                    className="btn btn-primary"
                    style={{ cursor: 'not-allowed', opacity: 0.6 }}
                  >
                    {products.omegaRc.action} (coming soon)
                  </button>
                  <p className="note" style={{ marginTop: 'var(--s-2)' }}>Public access will route here once published.</p>
                </>
              )}
            </div>
          </div>

          <div className="card" style={{ marginTop: 'var(--s-5)' }}>
            <h3 className="h2" style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--s-3)' }}>{products.omega.name}</h3>
            <p className="p-muted">{products.omega.subtitle}</p>
            <p className="p-muted">Used for:</p>
            <ul className="ul">
              {products.omega.usedFor.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <p className="p-muted">Access: {products.omega.access}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

