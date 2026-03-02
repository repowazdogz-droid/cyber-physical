const severityColor = { info: "var(--text-primary)", success: "var(--green)", warning: "var(--amber)", error: "var(--red)" };

export default function SignalsFeed({ signals }) {
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20 }}>SIGNALS FEED</div>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 24 }}>
        Chronological activity log. Every pipeline step and verification event.
      </p>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        {signals.length === 0 ? (
          <div style={{ padding: "40px 24px", textAlign: "center", fontSize: 13, color: "var(--text-dim)" }}>No signals yet. Run an engine to see activity.</div>
        ) : (
          <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
            {signals.map((s, i) => (
              <div
                key={i}
                style={{
                  padding: "10px 14px",
                  borderBottom: i < signals.length - 1 ? "1px solid var(--border)" : "none",
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  color: severityColor[s.severity] || "var(--text-secondary)",
                }}
              >
                <span style={{ color: "var(--text-dim)", marginRight: 10 }}>[{s.time}]</span>
                {s.engine && <span style={{ color: "var(--text-muted)", marginRight: 8 }}>{s.engine.toUpperCase()}:</span>}
                {s.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
