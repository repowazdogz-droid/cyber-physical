"use client";

import Link from "next/link";
import { useReveal } from "@/app/hooks/useReveal";

export default function ProofsSection() {
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
          Proofs you can verify.
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "var(--text-secondary)",
            maxWidth: 760,
            marginBottom: 22,
          }}
        >
          Every runtime now emits structured proof bundles that move through three layers of
          verification: the producer runtime, a browser quick check, and an independent verifier
          node. Three layers. If all three agree, the proof is valid. If any disagree, something is
          wrong — the browser check is fast but explicitly non-authoritative, the verifier node is
          the source of truth.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <Card
            title="RLT-1.0"
            body="Producer runtime for Research Lab tests. Runs the suite and emits an RLT-1.0 bundle (meta + trace, hash-chained, policy commitment bound)."
          />
          <Card
            title="TRT-1.0"
            body="Treaty Runtime trace proofs. Every agent action, every governance decision, captured as a portable TRT-1.0 bundle you can export and verify elsewhere."
          />
          <Card
            title="Verifier Node"
            body="Authoritative /api/verify verifier. Recomputes the hash chain, replays deterministic logic, enforces canonical JSON, and returns structured PASS/FAIL with diagnostics."
          />
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <Link
            href="/proofs"
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
            Open Proofs Hub
          </Link>
          <Link
            href="/research-lab"
            style={{
              padding: "8px 18px",
              borderRadius: 999,
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Open Research Lab
          </Link>
        </div>
      </div>
    </section>
  );
}

function Card(props: { title: string; body: string }) {
  return (
    <div
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
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--accent)",
          marginBottom: 6,
        }}
      >
        {props.title}
      </div>
      <p
        style={{
          fontSize: 13,
          color: "var(--text-secondary)",
        }}
      >
        {props.body}
      </p>
    </div>
  );
}

