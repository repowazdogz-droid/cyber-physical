import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Strength Box Bristol — Gym & PT",
  description: "24-hour gym and PT studio in Bishopston, Bristol BS7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-[#1a1a1a] text-[#f1f1f1] min-h-screen" style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
