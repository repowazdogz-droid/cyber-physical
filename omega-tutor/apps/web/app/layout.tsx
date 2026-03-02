import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Omega Tutor",
  description: "Detect → Diagnose → Repair → Remember",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        {children}
      </body>
    </html>
  );
}
