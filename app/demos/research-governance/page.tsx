import Link from "next/link";
import UiCard from "../../learning/ui/UiCard";
import { SPACING, TEXT_SIZES } from "../../learning/ui/uiTokens";

const spacing = SPACING.standard;
const text = TEXT_SIZES.standard;

export default function ResearchGovernanceDemoPage() {
  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: spacing.lg,
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: spacing.lg,
          gap: spacing.sm,
        }}
      >
        <div>
          <Link
            href="/demos"
            style={{ fontSize: text.small, color: "#2563eb", textDecoration: "none" }}
          >
            ← Demos
          </Link>
          <h1
            style={{
              fontSize: text.h1,
              fontWeight: 700,
              marginTop: spacing.xs,
            }}
          >
            Research Governance
          </h1>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: spacing.xs,
          }}
        >
          <Link
            href="/omega/research-governance.html"
            style={{ fontSize: text.small, color: "#2563eb", textDecoration: "none" }}
          >
            Open raw HTML →
          </Link>
        </div>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 2fr)",
          gap: spacing.lg,
          alignItems: "flex-start",
        }}
      >
        <div>
          <UiCard>
            <h2
              style={{
                fontSize: text.h2,
                fontWeight: 600,
                marginBottom: spacing.sm,
              }}
            >
              Framing
            </h2>
            <p
              style={{
                fontSize: text.body,
                color: "var(--text-muted, #4b5563)",
                marginBottom: spacing.sm,
              }}
            >
              Research Governance is a narrative surface for how OMEGA-style guardrails apply to
              scientific work: proposals, baselines, scaling traps, and promotion of claims.
            </p>
            <p
              style={{
                fontSize: text.small,
                color: "var(--text-muted, #6b7280)",
              }}
            >
              This pairs naturally with the{" "}
              <Link href="/research-lab" style={{ color: "#2563eb" }}>
                Research Lab Runtime
              </Link>{" "}
              tests — the demos give you intuition, the lab gives you proofs.
            </p>
          </UiCard>
        </div>

        <div>
          <UiCard
            style={{
              padding: 0,
              overflow: "hidden",
            }}
          >
            <iframe
              src="/omega/research-governance.html"
              title="Research Governance demo"
              sandbox="allow-scripts allow-same-origin allow-downloads allow-forms"
              style={{
                border: "none",
                width: "100%",
                minHeight: "820px",
              }}
            />
          </UiCard>
        </div>
      </section>
    </div>
  );
}

