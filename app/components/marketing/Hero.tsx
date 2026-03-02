"use client";

import Link from "next/link";
import { useReveal } from "@/app/hooks/useReveal";

export default function Hero() {
  const ref = useReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      className="reveal"
      style={{
        padding: "64px 16px 40px",
        background: "radial-gradient(circle at top, #14141a 0, #0a0a0c 55%)",
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "2.75rem",
            lineHeight: 1.1,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--accent)",
            marginBottom: "16px",
          }}
        >
          OPEN-SOURCE TRUST INFRASTRUCTURE
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "1.05rem",
            maxWidth: 720,
            color: "var(--text-secondary)",
            marginBottom: "28px",
          }}
        >
          AI is making decisions. Nobody can verify them. Eight open-source protocols that make AI
          reasoning inspectable, accountable, and safe. Hash-chained. Tamper-evident. Zero
          dependencies. Built for the age of autonomous agents.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <Link
            href="/demos/treaty-runtime"
            style={{
              padding: "10px 20px",
              borderRadius: 999,
              background: "var(--accent)",
              color: "#0b0b0e",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.3)",
            }}
          >
            Run Treaty Runtime
          </Link>
          <Link
            href="/research-lab"
            style={{
              padding: "10px 20px",
              borderRadius: 999,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text-primary)",
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Open Research Lab
          </Link>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 24,
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
            padding: "14px 0",
          }}
        >
          {[
            { label: "Protocols", value: "8" },
            { label: "Tests passing", value: "297" },
            { label: "Dependencies", value: "0" },
            { label: "License", value: "MIT" },
          ].map((stat) => (
            <div key={stat.label} style={{ minWidth: 120 }}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "1.25rem",
                  color: "var(--accent)",
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginTop: 2,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

