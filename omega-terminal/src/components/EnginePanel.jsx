import { useState, useEffect, useRef } from "react";
import RDEngine from "../engines/RDEngine";
import DecisionEngine from "../engines/DecisionEngine";
import UnifiedIntelligence from "./UnifiedIntelligence";
import { T, noiseURL } from "../styles/tokens";
import { LINK_MODES, rdToDecisionContext, decisionToRDContext } from "../utils/crosslink";

const BREAKPOINT = 900;
const RD_STAGES = 5;
const DEC_STAGES = 4;

export default function EnginePanel({
  onSignal,
  onRdStatus,
  onDecStatus,
  onRdChain,
  onDecChain,
  onRdStageData,
  onDecStageData,
  onRdPipelineTime,
  onDecPipelineTime,
}) {
  const [activeEngine, setActiveEngine] = useState("rd");
  const [isNarrow, setIsNarrow] = useState(false);
  const [rdStageData, setRdStageData] = useState(null);
  const [decStageData, setDecStageData] = useState(null);
  const [rdMerkle, setRdMerkle] = useState(null);
  const [decMerkle, setDecMerkle] = useState(null);
  const [rdPipelineTime, setRdPipelineTime] = useState(null);
  const [decPipelineTime, setDecPipelineTime] = useState(null);
  const [rdMeta, setRdMeta] = useState(null);
  const [decMeta, setDecMeta] = useState(null);
  const [linkMode, setLinkMode] = useState(LINK_MODES.NONE);
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let timeoutId = null;
    const apply = (w) => setIsNarrow(w > 0 && w < BREAKPOINT);
    const update = () => {
      const w = el.offsetWidth;
      if (timeoutId === null) {
        apply(w);
        timeoutId = -1;
      } else {
        if (timeoutId !== -1) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          timeoutId = null;
          apply(el.offsetWidth);
        }, 150);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      if (timeoutId != null && timeoutId !== -1) clearTimeout(timeoutId);
      ro.disconnect();
    };
  }, []);

  const rdProps = {
    onSignal: onSignal,
    onStatus: onRdStatus,
    onChain: (c) => { setRdMerkle(c); onRdChain?.(c); },
    onStageData: (d) => { setRdStageData(d); onRdStageData?.(d); },
    onPipelineTime: (t) => { setRdPipelineTime(t); onRdPipelineTime?.(t); },
    onMeta: setRdMeta,
    linkContext: linkMode === LINK_MODES.DEC_TO_RD && decStageData ? decisionToRDContext(decStageData) : "",
  };
  const decProps = {
    onSignal: onSignal,
    onStatus: onDecStatus,
    onChain: (c) => { setDecMerkle(c); onDecChain?.(c); },
    onStageData: (d) => { setDecStageData(d); onDecStageData?.(d); },
    onPipelineTime: (t) => { setDecPipelineTime(t); onDecPipelineTime?.(t); },
    onMeta: setDecMeta,
    linkContext: linkMode === LINK_MODES.RD_TO_DEC && rdStageData ? rdToDecisionContext(rdStageData) : "",
  };
  const rdMetaForExport = rdMeta !== null ? rdMeta : { query: null, iteration: null, elapsedMs: rdPipelineTime != null ? rdPipelineTime * 1000 : 0, model: "claude-sonnet-4-5-20250929" };
  const decMetaForExport = decMeta !== null ? decMeta : { brief: null, context: null, iteration: null, elapsedMs: decPipelineTime != null ? decPipelineTime * 1000 : 0, model: "claude-sonnet-4-5-20250929" };

  // Single layout so both engines stay mounted when crossing breakpoint (resize no longer aborts pipeline)
  const engineContainerStyle = isNarrow
    ? { display: "block", marginBottom: 16 }
    : { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, minHeight: 400, minWidth: 0 };
  const rdColumnStyle = {
    display: isNarrow && activeEngine !== "rd" ? "none" : undefined,
    minWidth: 0,
    minHeight: 0,
    ...(isNarrow ? {} : { border: "1px solid " + T.border0, borderRadius: T.r2, overflow: "hidden", background: T.bg2 }),
  };
  const decColumnStyle = {
    display: isNarrow && activeEngine !== "dec" ? "none" : undefined,
    minWidth: 0,
    minHeight: 0,
    ...(isNarrow ? {} : { border: "1px solid " + T.border0, borderRadius: T.r2, overflow: "hidden", background: T.bg2 }),
  };

  return (
    <div ref={containerRef} style={{ minWidth: 0, minHeight: 0, width: "100%", background: T.bg0, backgroundImage: noiseURL, backgroundRepeat: "repeat", color: T.text0, fontFamily: T.fontBody }}>
      <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: isNarrow ? 12 : 16, padding: "6px 10px", background: T.bg1, border: "1px solid " + T.border0, borderRadius: T.r2, flexWrap: "wrap" }}>
        <span style={{ fontSize: 9, color: T.text3, fontFamily: T.fontMono, letterSpacing: "0.1em" }}>LINK</span>
        {[
          { mode: LINK_MODES.NONE, label: "OFF" },
          { mode: LINK_MODES.RD_TO_DEC, label: "R&D → DEC" },
          { mode: LINK_MODES.DEC_TO_RD, label: "DEC → R&D" },
        ].map((opt) => (
          <button
            key={opt.mode}
            onClick={() => setLinkMode(opt.mode)}
            style={{
              padding: "4px 10px", fontSize: 10, fontWeight: 600,
              fontFamily: T.fontMono, letterSpacing: "0.06em",
              background: linkMode === opt.mode ? T.bg4 : "transparent",
              color: linkMode === opt.mode ? T.text0 : T.text3,
              border: linkMode === opt.mode ? "1px solid " + T.border2 : "1px solid transparent",
              borderRadius: T.r1, cursor: "pointer",
            }}
          >{opt.label}</button>
        ))}
      </div>
      {isNarrow && (
        <div style={{ display: "flex", gap: 2, marginBottom: 16, background: T.bg1, borderRadius: T.r2, padding: 3, border: "1px solid " + T.border0 }}>
          <button
            onClick={() => setActiveEngine("rd")}
            style={{
              flex: 1, padding: "12px 20px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
              background: activeEngine === "rd" ? T.bg3 : "transparent", border: "none", borderRadius: T.r1,
              color: activeEngine === "rd" ? T.text0 : T.text2, fontFamily: T.fontMono, cursor: "pointer", transition: "all 0.15s ease",
            }}
          >
            R&D ENGINE
          </button>
          <button
            onClick={() => setActiveEngine("dec")}
            style={{
              flex: 1, padding: "12px 20px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
              background: activeEngine === "dec" ? T.bg3 : "transparent", border: "none", borderRadius: T.r1,
              color: activeEngine === "dec" ? T.text0 : T.text2, fontFamily: T.fontMono, cursor: "pointer", transition: "all 0.15s ease",
            }}
          >
            DECISION ENGINE
          </button>
        </div>
      )}
      <div style={engineContainerStyle}>
        <div key="rd" style={rdColumnStyle}>
          {!isNarrow && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderBottom: "1px solid " + T.border0 }}>
                <div style={{ width: 6, height: 6, borderRadius: 2, background: T.mint, transform: "rotate(45deg)" }} />
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: T.fontMono, letterSpacing: "0.1em", color: T.text1 }}>R&D ENGINE</span>
                <span style={{ fontSize: 10, color: T.text3, fontFamily: T.fontMono }}>{RD_STAGES} stages</span>
              </div>
              {linkMode === LINK_MODES.DEC_TO_RD && decStageData && (
                <div style={{ fontSize: 10, color: T.mint, fontFamily: T.fontMono, marginBottom: 8, padding: "8px 16px" }}>
                  ⟵ Receiving Decision context ({decStageData.length} stages)
                </div>
              )}
            </>
          )}
          <div style={{ overflow: "auto", maxHeight: isNarrow ? undefined : "calc(100vh - 220px)" }}>
            <RDEngine {...rdProps} />
          </div>
        </div>
        <div key="dec" style={decColumnStyle}>
          {!isNarrow && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderBottom: "1px solid " + T.border0 }}>
                <div style={{ width: 6, height: 6, borderRadius: 2, background: T.blue, transform: "rotate(45deg)" }} />
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: T.fontMono, letterSpacing: "0.1em", color: T.text1 }}>DECISION ENGINE</span>
                <span style={{ fontSize: 10, color: T.text3, fontFamily: T.fontMono }}>{DEC_STAGES} stages</span>
              </div>
              {linkMode === LINK_MODES.RD_TO_DEC && rdStageData && (
                <div style={{ fontSize: 10, color: T.mint, fontFamily: T.fontMono, marginBottom: 8, padding: "8px 16px" }}>
                  ⟵ Receiving R&D context ({rdStageData.length} stages)
                </div>
              )}
            </>
          )}
          <div style={{ overflow: "auto", maxHeight: isNarrow ? undefined : "calc(100vh - 220px)" }}>
            <DecisionEngine {...decProps} />
          </div>
        </div>
      </div>
      {(rdStageData || decStageData) && (
        <div style={{ marginTop: isNarrow ? 16 : 20, borderTop: "1px solid " + T.border0, paddingTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: T.text3, marginBottom: 12, paddingLeft: 16, fontFamily: T.fontMono }}>
            UNIFIED INTELLIGENCE
          </div>
          <UnifiedIntelligence
            rdStageData={rdStageData}
            decStageData={decStageData}
            rdMerkle={rdMerkle}
            decMerkle={decMerkle}
            rdMeta={rdMetaForExport}
            decMeta={decMetaForExport}
          />
        </div>
      )}
    </div>
  );
}
