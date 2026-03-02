"use client";

import { useReveal } from "@/app/hooks/useReveal";

const PROTOCOLS = [
  {
    code: "CAP-1.0",
    name: "Clearpath",
    desc: "What was decided and why.",
  },
  {
    code: "CLP-1.0",
    name: "Cognitive Ledger",
    desc: "What the system believed.",
  },
  {
    code: "CNL-1.0",
    name: "Consent Ledger",
    desc: "What was authorised.",
  },
  {
    code: "ARP-1.0",
    name: "Assumption Registry",
    desc: "What was taken for granted.",
  },
  {
    code: "HTP-1.0",
    name: "Harm Trace",
    desc: "What could go wrong.",
  },
  {
    code: "DSP-1.0",
    name: "Dispute Protocol",
    desc: "Where they disagreed.",
  },
  {
    code: "TSP-1.0",
    name: "Trust Score",
    desc: "How much to trust it.",
  },
  {
    code: "EGP-1.0",
    name: "Ethics Gate",
    desc: "Whether it should proceed.",
  },
];

export default function TrustStack() {
  const ref = useReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      className="reveal"
      style={{
        padding: "48px 16px 40px",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.8rem",
            marginBottom: 10,
          }}
        >
          Eight protocols. Complete accountability.
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "var(--text-secondary)",
            maxWidth: 720,
            marginBottom: 22,
          }}
        >
          Each protocol is independent, hash-chained, and tamper-evident. Together they form a
          complete trust infrastructure for any AI system.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 16,
          }}
        >
          {PROTOCOLS.map((p) => (
            <div
              key={p.code}
              style={{
                background: "var(--bg-card)",
                borderRadius: 10,
                border: "1px solid var(--border)",
                padding: "14px 14px 12px",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--accent)",
                  marginBottom: 6,
                }}
              >
                {p.code}
              </div>
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                {p.name}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                }}
              >
                {p.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

