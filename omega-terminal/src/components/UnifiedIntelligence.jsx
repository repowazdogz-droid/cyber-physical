/**
 * OMEGA Trust Terminal — Unified Intelligence cross-engine view
 */

import { useState } from "react";
import { buildExportEnvelope } from "../utils/integrity";
import { T } from "../styles/tokens";
import { Card, Badge, SectionLabel } from "./ui";

export default function UnifiedIntelligence({
  rdStageData,
  decStageData,
  rdMerkle,
  decMerkle,
  rdMeta,
  decMeta,
}) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const envelope = await buildExportEnvelope(
        rdMeta || null,
        decMeta || null,
        rdStageData || null,
        decStageData || null,
        rdMerkle || null,
        decMerkle || null
      );
      const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "omega-trust-envelope-" + new Date().toISOString().slice(0, 10) + ".json";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const hasRd = Array.isArray(rdStageData) && rdStageData.length > 0;
  const hasDec = Array.isArray(decStageData) && decStageData.length > 0;
  const valid = hasRd && hasDec;
  const connections = hasRd && hasDec ? ["R&D and Decision outputs available for cross-reference."] : [];
  const gaps = [];
  if (hasRd && !hasDec) gaps.push("Decision engine not run.");
  if (hasDec && !hasRd) gaps.push("R&D engine not run.");
  const rdSentence = hasRd && rdStageData.length >= 5 && rdStageData[4]?.one_sentence ? rdStageData[4].one_sentence : null;
  const decSentence = hasDec && decStageData.length >= 4 && decStageData[3]?.the_sentence ? decStageData[3].the_sentence : null;
  const synthesis = (rdSentence || decSentence) ? { rd: rdSentence || "—", dec: decSentence || "—" } : null;

  return (
    <div style={{ padding: "0 16px 16px", background: T.bg2, border: "1px solid " + T.border0, borderRadius: T.r2, overflow: "hidden", fontFamily: T.fontBody, color: T.text0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Badge color={valid ? T.mint : T.coral} glow={valid ? T.mint + "18" : T.coral + "18"}>{valid ? "VERIFIED" : "INCOMPLETE"}</Badge>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 12 }}>
        <section style={{ flex: "1 1 200px" }}>
          <SectionLabel color={T.blue}>CONNECTIONS ({connections.length})</SectionLabel>
          {connections.length > 0 ? (
            connections.map((c, i) => (
              <Card key={i} borderColor={T.blue + "33"} style={{ borderLeft: "3px solid " + T.blue }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Badge color={T.blue}>CONNECTION</Badge>
                </div>
                <div style={{ fontSize: 13, color: T.text0, lineHeight: 1.7, fontFamily: T.fontBody }}>{c}</div>
              </Card>
            ))
          ) : (
            <div style={{ fontSize: 13, color: T.text3, fontFamily: T.fontBody }}>Run both engines to see connections.</div>
          )}
        </section>
        <section style={{ flex: "1 1 200px" }}>
          <SectionLabel color={T.amber}>GAPS ({gaps.length})</SectionLabel>
          {gaps.length > 0 ? (
            gaps.map((g, i) => (
              <Card key={i} borderColor={T.amber + "33"} style={{ borderLeft: "3px solid " + T.amber }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <Badge color={T.amber}>GAP</Badge>
                </div>
                <div style={{ fontSize: 13, color: T.text0, lineHeight: 1.7, fontFamily: T.fontBody }}>{g}</div>
              </Card>
            ))
          ) : (
            <div style={{ fontSize: 13, color: T.text3, fontFamily: T.fontBody }}>None identified.</div>
          )}
        </section>
      </div>
      {synthesis && (
        <div style={{
          marginBottom: 16, padding: "24px 28px", borderRadius: T.r3,
          background: `linear-gradient(175deg, ${T.mint}06 0%, ${T.bg1} 30%, ${T.blue}04 70%, ${T.bg0} 100%)`,
          border: "1px solid " + T.mint + "18",
          boxShadow: T.shadowGlow(T.mint) + ", inset 0 1px 0 " + T.mint + "08",
        }}>
          <SectionLabel color={T.mint} style={{ letterSpacing: "0.2em", marginBottom: 20 }}>THE TWO SENTENCES</SectionLabel>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, color: T.text3, fontFamily: T.fontMono, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>R&D — THE SENTENCE THAT SURVIVES THE MEETING</div>
            <div style={{ fontSize: "clamp(14px, 2.5vw, 17px)", lineHeight: 1.9, color: T.mint, fontFamily: T.fontDisplay, fontStyle: "italic" }}>"{synthesis.rd}"</div>
          </div>
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, " + T.border1 + ", transparent)", margin: "16px 0" }} />
          <div>
            <div style={{ fontSize: 9, color: T.text3, fontFamily: T.fontMono, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>DECISION — THE BOARD SENTENCE</div>
            <div style={{ fontSize: "clamp(14px, 2.5vw, 17px)", lineHeight: 1.9, color: T.blue, fontFamily: T.fontDisplay, fontStyle: "italic" }}>"{synthesis.dec}"</div>
          </div>
        </div>
      )}
      <button
        onClick={handleExport}
        disabled={exporting}
        style={{
          padding: "10px 18px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
          background: exporting ? T.bg2 : "transparent",
          border: "1px solid " + (exporting ? T.border0 : T.mint),
          borderRadius: T.r1,
          color: exporting ? T.text3 : T.mint,
          cursor: exporting ? "not-allowed" : "pointer",
          fontFamily: T.fontMono,
        }}
      >
        {exporting ? "EXPORTING…" : "EXPORT ENVELOPE"}
      </button>
    </div>
  );
}
