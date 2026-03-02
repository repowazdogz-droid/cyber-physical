"use client";

import { useReveal } from "@/app/hooks/useReveal";

const NODES = ["OBSERVE", "DERIVE", "ASSUME", "DECIDE", "ACT"];

export default function ReasoningChain() {
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
            marginBottom: 12,
          }}
        >
          One reasoning structure. Every domain.
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "var(--text-secondary)",
            maxWidth: 760,
            marginBottom: 20,
          }}
        >
          Every decision — clinical, financial, educational, autonomous — follows the same
          structure. An observation is made. An inference is drawn. An assumption is held. A choice
          is reached. An action is taken.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            padding: "18px 20px",
            borderRadius: 12,
            border: "1px solid var(--border)",
            background:
              "linear-gradient(135deg, rgba(197,165,114,0.08), rgba(12,12,16,0.9))",
          }}
        >
          {NODES.map((node, idx) => (
            <div
              key={node}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  padding: "8px 14px",
                  borderRadius: 999,
                  border: "1px solid var(--accent)",
                  color: "var(--accent)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  background: "rgba(0,0,0,0.15)",
                }}
              >
                {node}
              </div>
              {idx < NODES.length - 1 && (
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--text-muted)",
                  }}
                >
                  →
                </span>
              )}
            </div>
          ))}
        </div>

        <p
          style={{
            marginTop: 16,
            fontSize: 14,
            color: "var(--text-secondary)",
            maxWidth: 760,
          }}
        >
          The Omega trust stack is built on this structure. Each protocol captures a different
          dimension of the reasoning chain, creating complete accountability from authorisation
          through to consequence.
        </p>
      </div>
    </section>
  );
}

