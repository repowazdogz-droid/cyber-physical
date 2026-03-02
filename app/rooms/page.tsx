import Link from 'next/link';

export default function RoomsPage() {
  return (
    <div className="site-container">
      <div className="site-main">
        <div className="site-content" style={{ maxWidth: '700px', margin: '0 auto', paddingTop: '4rem' }}>
          <h1 className="site-h1" style={{ textAlign: 'center', marginBottom: '1rem' }}>
            Advanced inspection
          </h1>
          <p
            className="site-text-lg"
            style={{
              textAlign: 'center',
              marginBottom: '3rem',
              color: '#525252',
            }}
          >
            These views let you inspect and refine parts of an explanation by reasoning mode.
            Most people won't need this.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Link href="/explain" className="site-btn site-btn-primary">
              Go to Explain
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

