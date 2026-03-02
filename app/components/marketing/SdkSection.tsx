"use client";

import Link from "next/link";
import { useReveal } from "@/app/hooks/useReveal";

const CLEARPATH_REPO_URL = "https://github.com/repowazdogz-droid/clearpath";

export default function SdkSection() {
  const ref = useReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      className="reveal"
      style={{
        padding: "48px 16px 40px",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.8rem",
            marginBottom: 10,
          }}
        >
          Build on it.
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "var(--text-secondary)",
            marginBottom: 16,
          }}
        >
          Clearpath SDK. TypeScript. Zero external dependencies. SHA-256 hash chains.
          Tamper-evident. MIT licensed. Library, not service. No server. No database. No UI. The
          protocol layer that applications build on.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 20,
            marginBottom: 16,
          }}
        >
          {[
            { label: "Tests", value: "27" },
            { label: "Dependencies", value: "0" },
            { label: "License", value: "MIT" },
          ].map((stat) => (
            <div key={stat.label} style={{ minWidth: 120 }}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "1.1rem",
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

        <Link
          href={CLEARPATH_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: "8px 18px",
            borderRadius: 999,
            background: "var(--accent)",
            color: "#0b0b0e",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          View on GitHub
        </Link>
      </div>
    </section>
  );
}

