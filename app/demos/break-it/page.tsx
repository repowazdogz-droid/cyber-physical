import Link from "next/link";
import UiCard from "../../learning/ui/UiCard";
import { SPACING, TEXT_SIZES } from "../../learning/ui/uiTokens";

const spacing = SPACING.standard;
const text = TEXT_SIZES.standard;

export default function BreakItDemoPage() {
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
            Break It
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
            href="/omega/omega-break-it.html"
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
              What this demo is for
            </h2>
            <p
              style={{
                fontSize: text.body,
                color: "var(--text-muted, #4b5563)",
                marginBottom: spacing.sm,
              }}
            >
              Break It is a controlled red-team surface: it&apos;s designed to be stressed, poked,
              and broken so you can see how governance, reasoning, and traceability fail.
            </p>
            <ol
              style={{
                margin: 0,
                paddingLeft: 20,
                fontSize: text.body,
                lineHeight: 1.7,
              }}
            >
              <li>Try to violate constraints using the provided controls.</li>
              <li>Watch how failures are surfaced (or not) in the UI.</li>
              <li>Map what you see back to the Research Lab irreducibility tests.</li>
            </ol>
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
              src="/omega/omega-break-it.html"
              title="Break It demo"
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

