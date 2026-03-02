import "@/app/styles/globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { DevBanner } from "./components/DevBanner";

const siteUrl = process.env.SITE_URL || "http://127.0.0.1:3001";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "OMEGA — Open-source trust infrastructure",
  description:
    "Open-source protocols and runtimes for governing AI decisions with verifiable reasoning traces.",
  openGraph: {
    title: "OMEGA — Open-source trust infrastructure",
    description:
      "Open-source protocols and runtimes for governing AI decisions with verifiable reasoning traces.",
    url: siteUrl,
    type: 'website',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'OMEGA — Human-led cognitive infrastructure',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OMEGA — Open-source trust infrastructure",
    description:
      "Open-source protocols and runtimes for governing AI decisions with verifiable reasoning traces.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ background: "var(--bg-deep)", color: "var(--text-primary)" }}>
        <DevBanner />
        <header
          style={{
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-surface)",
          }}
        >
          <nav
            style={{
              maxWidth: 1080,
              margin: "0 auto",
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <Link
              href="/"
              style={{
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                textDecoration: "none",
                color: "var(--text-secondary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              OMEGA
            </Link>
            <div
              style={{
                display: "flex",
                gap: 12,
                fontSize: 13,
              }}
            >
              <Link
                href="/"
                style={{
                  textDecoration: "none",
                  color: "var(--text-secondary)",
                }}
              >
                Home
              </Link>
              <Link
                href="/demos"
                style={{
                  textDecoration: "none",
                  color: "var(--text-secondary)",
                }}
              >
                Demos
              </Link>
              <Link
                href="/proofs"
                style={{
                  textDecoration: "none",
                  color: "var(--text-secondary)",
                }}
              >
                Proofs
              </Link>
              <Link
                href="/research-lab"
                style={{
                  textDecoration: "none",
                  color: "var(--text-secondary)",
                }}
              >
                Research Lab
              </Link>
              <Link
                href="/omega/omega-research-paper.pdf"
                style={{
                  textDecoration: "none",
                  color: "var(--text-secondary)",
                }}
              >
                Paper
              </Link>
            </div>
          </nav>
        </header>
        <main>
          {children}
        </main>
      </body>
    </html>
  )
}
