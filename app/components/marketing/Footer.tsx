"use client";

import { useReveal } from "@/app/hooks/useReveal";

export default function MarketingFooter() {
  const ref = useReveal<HTMLElement>();

  return (
    <footer
      ref={ref}
      className="reveal"
      style={{
        padding: "32px 16px 40px",
        borderTop: "1px solid var(--border)",
        marginTop: 24,
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          fontSize: 13,
          color: "var(--text-secondary)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--accent-dim)",
          }}
        >
          Omega Protocol
        </div>
        <div>Built in Bristol. Open-source for humanity.</div>
        <div>Safety and human care first. In every protocol. In every decision.</div>
        <a href="mailto:warrensmith8@ymail.com" style={{ color: "var(--text-secondary)", textDecoration: "underline" }}>warrensmith8@ymail.com</a>
      </div>
    </footer>
  );
}

