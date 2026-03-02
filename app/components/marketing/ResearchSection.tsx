"use client";

import Link from "next/link";
import { useReveal } from "@/app/hooks/useReveal";

export default function ResearchSection() {
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
          The irreducibility conjecture.
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "var(--text-secondary)",
            marginBottom: 16,
          }}
        >
          Remove governance — rogue actions execute. Remove reasoning — decisions become opaque.
          Remove traceability — tampering goes undetected. No primitive is redundant. 19 tests
          currently exercise five concrete properties — integrity, policy binding, determinism,
          inspectability, and human-in-the-loop — under the three primitives.
        </p>

        <div
          style={{
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--bg-card)",
            padding: "14px 16px 12px",
            marginBottom: 16,
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    paddingBottom: 6,
                    borderBottom: "1px solid var(--border)",
                    color: "var(--text-muted)",
                    fontWeight: 500,
                  }}
                >
                  Property removed
                </th>
                <th
                  style={{
                    textAlign: "left",
                    paddingBottom: 6,
                    borderBottom: "1px solid var(--border)",
                    color: "var(--text-muted)",
                    fontWeight: 500,
                  }}
                >
                  Failure mode
                </th>
              </tr>
            </thead>
            <tbody>
              <Row
                primitive="Integrity (hash chain)"
                failure="Remove it and tampering can occur without structural detection — hashes no longer witness changes."
              />
              <Row
                primitive="Policy binding"
                failure="Remove it and agents can act outside their mandate even when the chain is intact."
              />
              <Row
                primitive="Determinism"
                failure="Remove it and identical inputs can produce different decisions on replay."
              />
              <Row
                primitive="Inspectability"
                failure="Remove it and decisions become opaque — you see outcomes, not OBSERVE→DERIVE→ASSUME→DECIDE→ACT."
              />
              <Row
                primitive="Human-in-the-loop"
                failure="Remove it and autonomous actions have no override or escalation path."
              />
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <Link
            href="/omega/omega-research-paper.pdf"
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
            Read the paper
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
            Run the tests yourself
          </Link>
        </div>
      </div>
    </section>
  );
}

function Row(props: { primitive: string; failure: string }) {
  return (
    <tr>
      <td
        style={{
          paddingTop: 6,
          paddingRight: 10,
          verticalAlign: "top",
          color: "var(--text-secondary)",
        }}
      >
        {props.primitive}
      </td>
      <td
        style={{
          paddingTop: 6,
          color: "var(--text-secondary)",
        }}
      >
        {props.failure}
      </td>
    </tr>
  );
}

