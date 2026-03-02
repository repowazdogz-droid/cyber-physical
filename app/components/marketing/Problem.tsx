"use client";

import { useReveal } from "@/app/hooks/useReveal";

export default function Problem() {
  const ref = useReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      className="reveal"
      style={{
        padding: "56px 16px 32px",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.9rem",
            marginBottom: 16,
          }}
        >
          Trust doesn&apos;t scale with intelligence
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "var(--text-secondary)",
            marginBottom: 14,
          }}
        >
          AI agents are booking flights, writing code, making clinical recommendations, and trading
          financial instruments. They&apos;re making millions of consequential decisions per day
          with no audit trail, no consent verification, and no accountability when things go wrong.
        </p>
        <p
          style={{
            fontSize: 15,
            color: "var(--text-secondary)",
            marginBottom: 14,
          }}
        >
          The EU AI Act requires documented reasoning chains for high-risk AI systems. Compliance
          obligations are phasing in now, with high-risk requirements on a near-term horizon. The
          infrastructure to produce those chains doesn&apos;t exist.
        </p>
        <p
          style={{
            fontSize: 15,
            color: "var(--text-secondary)",
          }}
        >
          Until now.
        </p>
      </div>
    </section>
  );
}

