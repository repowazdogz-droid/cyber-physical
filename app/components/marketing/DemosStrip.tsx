"use client";

import Link from "next/link";
import { useReveal } from "@/app/hooks/useReveal";

const DEMOS = [
  {
    title: "Manufacturing",
    body: "Thermal fault on a factory floor. LOTO policy. Sensor noise. Watch governance enforce safety constraints in real time.",
    href: "/omega/factory-floor-intelligence.html",
  },
  {
    title: "Defence",
    body: "Coalition intelligence sharing. ORCON classification. Command authority chains. Watch trust boundaries enforce need-to-know.",
    href: "/omega/defence-autonomous-governance.html",
  },
  {
    title: "Financial Services",
    body: "Autonomous trading agent. Position limits. Escalation triggers. Watch governance prevent unauthorised risk.",
    href: "/omega/mev-trust-auction-v2.html",
  },
  {
    title: "AI Governance",
    body: "Treaty Runtime. Agents negotiate under governance constraints. Every action produces a TRT-1.0 proof bundle you can export and verify independently — the verifier node, not the demo, is the authority.",
    href: "/demos/treaty-runtime",
  },
];

export default function DemosStrip() {
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
          See it working.
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "var(--text-secondary)",
            maxWidth: 720,
            marginBottom: 20,
          }}
        >
          Interactive demos across manufacturing, defence, financial systems, and AI governance —
          all running on the same trust stack.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {DEMOS.map((demo) => (
            <Link
              key={demo.title}
              href={demo.href}
              style={{
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  background: "var(--bg-card)",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  padding: "14px 14px 12px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  transition: "background 0.2s ease, border-color 0.2s ease, transform 0.2s ease",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--accent)",
                  }}
                >
                  {demo.title}
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    flex: 1,
                  }}
                >
                  {demo.body}
                </p>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--accent)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  Open demo →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

