import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Research Lab — OMEGA",
  description:
    "Autonomous research governance runtime: run and test governance, reasoning, and traceability.",
};

export default function ResearchLabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
