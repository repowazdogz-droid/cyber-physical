# OMEGA Terminal — Full Source Output

Complete source for external review. Each section: filepath header then full file contents.

---

## omega-terminal/src/components/EnginePanel.jsx

```jsx
import { useState, useEffect, useRef } from "react";
import RDEngine from "../engines/RDEngine";
import DecisionEngine from "../engines/DecisionEngine";

const BREAKPOINT = 900;

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
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.offsetWidth;
      setIsNarrow(w > 0 && w < BREAKPOINT);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rdProps = {
    onSignal: onSignal,
    onStatus: onRdStatus,
    onChain: onRdChain,
    onStageData: onRdStageData,
    onPipelineTime: onRdPipelineTime,
  };
  const decProps = {
    onSignal: onSignal,
    onStatus: onDecStatus,
    onChain: onDecChain,
    onStageData: onDecStageData,
    onPipelineTime: onDecPipelineTime,
  };

  if (isNarrow) {
    return (
      <div ref={containerRef} style={{ minWidth: 0, minHeight: 0, width: "100%" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setActiveEngine("rd")}
            style={{
              padding: "12px 20px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              background: activeEngine === "rd" ? "var(--bg-hover)" : "transparent",
              border: "1px solid var(--border)",
              borderRadius: 6,
              color: activeEngine === "rd" ? "var(--text-primary)" : "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            R&D ENGINE
          </button>
          <button
            onClick={() => setActiveEngine("dec")}
            style={{
              padding: "12px 20px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              background: activeEngine === "dec" ? "var(--bg-hover)" : "transparent",
              border: "1px solid var(--border)",
              borderRadius: 6,
              color: activeEngine === "dec" ? "var(--text-primary)" : "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            DECISION ENGINE
          </button>
        </div>
        {activeEngine === "rd" && <RDEngine {...rdProps} />}
        {activeEngine === "dec" && <DecisionEngine {...decProps} />}
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, minHeight: 400, minWidth: 0, width: "100%" }}>
      <div style={{ minWidth: 0, border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", background: "var(--bg-card)" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)" }}>
          R&D ENGINE
        </div>
        <div style={{ overflow: "auto", maxHeight: "calc(100vh - 220px)" }}>
          <RDEngine {...rdProps} />
        </div>
      </div>
      <div style={{ minWidth: 0, border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", background: "var(--bg-card)" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)" }}>
          DECISION ENGINE
        </div>
        <div style={{ overflow: "auto", maxHeight: "calc(100vh - 220px)" }}>
          <DecisionEngine {...decProps} />
        </div>
      </div>
    </div>
  );
}
```

---

## omega-terminal/src/engines/RDEngine.jsx

(Full 302 lines — see repo file `src/engines/RDEngine.jsx`)

---

## omega-terminal/src/engines/DecisionEngine.jsx

(Full 262 lines — see repo file `src/engines/DecisionEngine.jsx`)

---

## omega-terminal/src/utils/crypto.js

## omega-terminal/src/utils/citations.js

## omega-terminal/src/utils/validators.js

## omega-terminal/scripts/test-engines.mjs

## omega-terminal/src/components/IntegrityConsole.jsx

(Remaining files appended in next edit to stay under size limit)
