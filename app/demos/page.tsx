import Link from "next/link";
import UiCard from "../learning/ui/UiCard";
import { SPACING, TEXT_SIZES } from "../learning/ui/uiTokens";

const spacing = SPACING.standard;
const text = TEXT_SIZES.standard;

const DEMOS = [
  {
    slug: "treaty-runtime",
    title: "Treaty Runtime (flagship)",
    description:
      "Governance + reasoning + traceability for autonomous treaty evaluation.",
    html: "treaty-runtime.html",
    hasPage: true,
  },
  {
    slug: "research-governance",
    title: "Research Governance",
    description: "Non-obvious research scenarios with governance overlays.",
    html: "research-governance.html",
    hasPage: true,
  },
  {
    slug: "factory-floor",
    title: "Factory Floor Intelligence",
    description: "Procedural automation + constraint enforcement on the factory floor.",
    html: "factory-floor-intelligence.html",
    hasPage: false,
  },
  {
    slug: "defence",
    title: "Defence Autonomous Governance",
    description: "Policy-aligned autonomous defence scenarios.",
    html: "defence-autonomous-governance.html",
    hasPage: false,
  },
  {
    slug: "mev",
    title: "MEV Trust Auction",
    description: "On-chain MEV auction reasoning with explicit constraints.",
    html: "mev-trust-auction-v2.html",
    hasPage: false,
  },
  {
    slug: "swarm",
    title: "Swarm Governance",
    description: "Multi-agent swarm behaviors under explicit guardrails.",
    html: "swarm-governance.html",
    hasPage: false,
  },
  {
    slug: "wallet",
    title: "Wallet Firewall",
    description: "Wallet-level constraints and transaction vetting.",
    html: "wallet-firewall.html",
    hasPage: false,
  },
  {
    slug: "trust-layer",
    title: "Omega Trust Layer",
    description: "Trust-layer demo for existing systems.",
    html: "omega-trust-layer-demo.html",
    hasPage: false,
  },
  {
    slug: "audit-replay",
    title: "Audit Replay",
    description: "Replay decisions with full traceability.",
    html: "audit-replay.html",
    hasPage: false,
  },
  {
    slug: "red-team",
    title: "Red Team",
    description: "Adversarial scenarios against the runtime.",
    html: "red-team.html",
    hasPage: false,
  },
];

export default function DemosPage() {
  return (
    <div
      style={{
        maxWidth: 1080,
        margin: "0 auto",
        padding: spacing.lg,
      }}
    >
      <section style={{ marginBottom: spacing.lg }}>
        <h1
          style={{
            fontSize: text.h1,
            fontWeight: 700,
            marginBottom: spacing.sm,
          }}
        >
          Demos
        </h1>
        <p
          style={{
            fontSize: text.body,
            color: "var(--text-muted, #4b5563)",
            maxWidth: 720,
            lineHeight: 1.6,
          }}
        >
          Flagship Treaty Runtime first, followed by a directory of demos that exercise different
          surfaces of governance, reasoning, and traceability.
        </p>
      </section>

      <section style={{ marginBottom: spacing.lg }}>
        <UiCard>
          <h2
            style={{
              fontSize: text.h2,
              fontWeight: 600,
              marginBottom: spacing.sm,
            }}
          >
            Flagship
          </h2>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: spacing.md,
            }}
          >
            <div style={{ flex: "1 1 260px" }}>
              <h3 style={{ fontSize: text.h3, fontWeight: 600, marginBottom: spacing.xs }}>
                Treaty Runtime
              </h3>
              <p
                style={{
                  fontSize: text.body,
                  color: "var(--text-muted, #4b5563)",
                  marginBottom: spacing.sm,
                }}
              >
                Governance-enforced treaty evaluation with explicit reasoning traces and
                proof-object export.
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: spacing.sm,
                }}
              >
                <Link
                  href="/demos/treaty-runtime"
                  style={{
                    padding: "8px 14px",
                    borderRadius: 999,
                    backgroundColor: "#111827",
                    color: "white",
                    textDecoration: "none",
                    fontSize: text.small,
                    fontWeight: 500,
                  }}
                >
                  Open embedded demo →
                </Link>
                <Link
                  href="/omega/treaty-runtime.html"
                  style={{
                    padding: "8px 14px",
                    borderRadius: 999,
                    border: "1px solid #d1d5db",
                    backgroundColor: "#ffffff",
                    color: "#111827",
                    textDecoration: "none",
                    fontSize: text.small,
                  }}
                >
                  Open raw HTML
                </Link>
              </div>
            </div>
          </div>
        </UiCard>
      </section>

      <section>
        <UiCard>
          <h2
            style={{
              fontSize: text.h2,
              fontWeight: 600,
              marginBottom: spacing.sm,
            }}
          >
            All demos
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: spacing.md,
            }}
          >
            {DEMOS.map((demo) => (
              <div key={demo.slug} style={{ borderRadius: 10 }}>
                <h3
                  style={{
                    fontSize: text.h3,
                    fontWeight: 600,
                    marginBottom: spacing.xs,
                  }}
                >
                  {demo.title}
                </h3>
                <p
                  style={{
                    fontSize: text.small,
                    color: "var(--text-muted, #4b5563)",
                    marginBottom: spacing.sm,
                  }}
                >
                  {demo.description}
                </p>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: spacing.xs,
                    fontSize: text.small,
                  }}
                >
                  {demo.hasPage && (
                    <Link
                      href={`/demos/${demo.slug}`}
                      style={{
                        textDecoration: "none",
                        color: "#2563eb",
                      }}
                    >
                      Open embedded →
                    </Link>
                  )}
                  <Link
                    href={`/omega/${demo.html}`}
                    style={{
                      textDecoration: "none",
                      color: "#6b7280",
                    }}
                  >
                    Open raw HTML
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </UiCard>
      </section>
    </div>
  );
}

