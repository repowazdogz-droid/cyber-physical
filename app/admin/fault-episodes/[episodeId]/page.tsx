// app/admin/fault-episodes/[episodeId]/page.tsx

import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "../../../(site)/components/Container";
import { Section } from "../../../(site)/components/Section";
import UiCard from "../../../ui/UiCard";
const Card = UiCard;
import type { FaultEpisodeAnalysis } from "@/spine/sim/analyzeFaultEpisode";

function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toFixed(3);
}

function fmtT(n: number | undefined): string {
  if (typeof n !== "number") return "—";
  return `${n.toFixed(1)}s`;
}

async function loadEpisodeData(episodeId: string) {
  const baseDir = path.join(process.cwd(), "artifacts", "fault-episodes", episodeId);

  // Check if directory exists
  if (!fs.existsSync(baseDir)) {
    return null;
  }

  const simShaPath = path.join(baseDir, "sim.sha256");
  const reportJsonPath = path.join(baseDir, "report.json");
  const reportMdPath = path.join(baseDir, "report.md");

  let simHash = "";
  if (fs.existsSync(simShaPath)) {
    simHash = fs.readFileSync(simShaPath, "utf8").trim();
  }

  let analysis: FaultEpisodeAnalysis | null = null;
  if (fs.existsSync(reportJsonPath)) {
    const raw = fs.readFileSync(reportJsonPath, "utf8");
    analysis = JSON.parse(raw) as FaultEpisodeAnalysis;
  }

  let reportMd = "";
  if (fs.existsSync(reportMdPath)) {
    reportMd = fs.readFileSync(reportMdPath, "utf8");
  }

  return { simHash, analysis, reportMd, baseDir };
}

export default async function FaultEpisodeDetailPage({
  params,
}: {
  params: Promise<{ episodeId: string }> | { episodeId: string };
}) {
  // Handle both Promise and direct params (Next.js 14 compatibility)
  const resolvedParams = params instanceof Promise ? await params : params;
  const { episodeId } = resolvedParams;
  
  let data;
  try {
    data = await loadEpisodeData(episodeId);
  } catch (error: any) {
    console.error("Failed to load episode data:", error);
    notFound();
  }

  if (!data) {
    notFound();
  }

  const { simHash, analysis, reportMd, baseDir } = data;

  return (
    <Section>
      <Container>
        <div className="row-between">
          <div>
            <h1 className="h1">Fault Episode: {episodeId}</h1>
            <p className="p-muted">Deterministic simulation viewer (read-only)</p>
          </div>
          <Link href="/admin/fault-episodes" className="btn" style={{ textDecoration: "none" }}>
            ← Back to list
          </Link>
        </div>

        <div className="stack" style={{ marginTop: "var(--s-5)" }}>
          {/* Determinism Anchor */}
          <Card variant="elevated">
            <div className="label">Determinism Anchor</div>
            <div className="mono" style={{ fontSize: "var(--text-sm)", wordBreak: "break-all" }}>
              sim.sha256: {simHash || "—"}
            </div>
          </Card>

          {/* Key Events & Metrics */}
          {analysis && (
            <>
              <Card variant="elevated">
                <div className="label">Key Events</div>
                <div className="p">
                  <strong>Fault injected:</strong>{" "}
                  {analysis.faultInjected ? fmtT(analysis.faultInjected.t) : "—"}
                </div>
                <div className="p">
                  <strong>Envelope breach:</strong>{" "}
                  {analysis.envelopeBreach ? fmtT(analysis.envelopeBreach.t) : "—"}
                </div>
              </Card>

              <Card variant="elevated">
                <div className="label">Error Metrics</div>
                <div className="p">
                  <strong>Max position error:</strong> {fmt(analysis.positionError.max)} m
                </div>
                <div className="p">
                  <strong>RMS position error:</strong> {fmt(analysis.positionError.rms)} m
                </div>
                <div className="p">
                  <strong>Error @ fault:</strong> {fmt(analysis.positionError.atFault)} m
                </div>
                <div className="p">
                  <strong>Error @ breach:</strong> {fmt(analysis.positionError.atBreach)} m
                </div>
              </Card>

              <Card variant="elevated">
                <div className="label">Confidence Metrics</div>
                <div className="p">
                  <strong>Mean confidence (pre-fault):</strong> {fmt(analysis.confidence.preFaultMean)}
                </div>
                <div className="p">
                  <strong>Mean confidence (post-fault):</strong>{" "}
                  {fmt(analysis.confidence.postFaultMean)}
                </div>
                <div className="p">
                  <strong>Confidence @ fault:</strong> {fmt(analysis.confidence.atFault)}
                </div>
                <div className="p">
                  <strong>Confidence @ breach:</strong> {fmt(analysis.confidence.atBreach)}
                </div>
                <div className="p">
                  <strong>Confidence–error mismatch:</strong>{" "}
                  {analysis.confidence.mismatchFlag ? "YES" : "NO"}
                </div>
              </Card>
            </>
          )}

          {/* Report Markdown */}
          {reportMd && (
            <Card variant="elevated">
              <div className="row-between">
                <div className="label">Full Report (report.md)</div>
                <div>
                  <a
                    href={`/api/fault-episodes/${episodeId}/report.md`}
                    download
                    className="btn"
                    style={{ textDecoration: "none", marginRight: "var(--s-2)" }}
                  >
                    Download MD
                  </a>
                  <a
                    href={`/api/fault-episodes/${episodeId}/report.json`}
                    download
                    className="btn"
                    style={{ textDecoration: "none", marginRight: "var(--s-2)" }}
                  >
                    Download JSON
                  </a>
                  <a
                    href={`/api/fault-episodes/${episodeId}/sim.json`}
                    download
                    className="btn"
                    style={{ textDecoration: "none" }}
                  >
                    Download sim.json
                  </a>
                </div>
              </div>
              <pre className="pre" style={{ marginTop: "var(--s-4)", maxHeight: "600px", overflow: "auto" }}>
                {reportMd}
              </pre>
            </Card>
          )}
        </div>
      </Container>
    </Section>
  );
}

