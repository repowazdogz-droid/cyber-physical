import { LANDING_COPY } from "@/app/content/landing";

const LONG_FORM_GPT_URL = 'https://chat.openai.com/g/g-omega-long-form'; // Update with actual URL

export default function Footer() {
  return (
    <footer className="section" style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--s-7)' }}>
      <div className="site-wrap">
        <div className="site-measure">
          <p className="note" style={{ whiteSpace: 'pre-line' }}>{LANDING_COPY.footer}</p>
          <p className="note" style={{ marginTop: 'var(--s-4)', fontSize: '0.875rem', color: '#737373' }}>
            Omega RC ·{' '}
            <a
              href={LONG_FORM_GPT_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#737373',
                textDecoration: 'underline',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#171717';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#737373';
              }}
            >
              Long-form analysis (experimental)
            </a>
            {' →'}
          </p>
        </div>
      </div>
    </footer>
  );
}

