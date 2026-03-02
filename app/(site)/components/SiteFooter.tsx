import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-links">
          <Link className="site-footer-link" href="/demo">/demo</Link>
          <Link className="site-footer-link" href="/kernel-studio">/kernel-studio</Link>
          <Link className="site-footer-link" href="/kernels/uav">/kernels/uav</Link>
          <Link className="site-footer-link" href="/orchestrator">/orchestrator</Link>
          <Link className="site-footer-link" href="/regression">/regression</Link>
        </div>

        <div style={{ lineHeight: 1.75 }}>
          <strong>Important:</strong> LLM assistance (Gemini) is non-authoritative. It can draft and explain, but the
          decision framework remains the truth layer: <span style={{ fontWeight: 500 }}>Validator → Compile → Constraint Sets → Decision Records → Reference Decisions</span>.
          Humans remain in control; we do not ship hidden autonomy.
        </div>

        <div className="site-text-xs" style={{ color: '#737373' }}>
          Research-grade prototypes · Deterministic & bounded outputs · ND-friendly surfaces
        </div>
      </div>
    </footer>
  );
}
