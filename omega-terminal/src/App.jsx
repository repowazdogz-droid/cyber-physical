import { useState, useEffect, useCallback } from "react";
import StatusStrip from "./components/StatusStrip";
import NavigationRail from "./components/NavigationRail";
import EnginePanel from "./components/EnginePanel";
import TrustStackPanel from "./components/TrustStackPanel";
import IntegrityConsole from "./components/IntegrityConsole";
import SignalsFeed from "./components/SignalsFeed";
import OmegaTrustTerminalDesign from "./components/OmegaTrustTerminalDesign";

const PANELS = ["engines", "design", "trust", "integrity", "signals"];

export default function App() {
  const [activePanel, setActivePanel] = useState("engines");
  const [clock, setClock] = useState("");
  const [signals, setSignals] = useState([]);
  const [rdStatus, setRdStatus] = useState("idle");
  const [decStatus, setDecStatus] = useState("idle");
  const [rdChain, setRdChain] = useState(null);
  const [decChain, setDecChain] = useState(null);
  const [rdStageData, setRdStageData] = useState(null);
  const [decStageData, setDecStageData] = useState(null);
  const [rdPipelineTime, setRdPipelineTime] = useState(null);
  const [decPipelineTime, setDecPipelineTime] = useState(null);
  const [railCollapsed, setRailCollapsed] = useState(false);

  const emitSignal = useCallback((payload) => {
    const ts = new Date();
    const time = ts.toTimeString().split(" ")[0];
    setSignals((prev) => [{ time, ...payload }, ...prev].slice(0, 200));
  }, []);

  useEffect(() => {
    const tick = () => setClock(new Date().toUTCString().replace(" GMT", "").split(" ").slice(4).join(" "));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const engineProps = {
    onSignal: emitSignal,
    onRdStatus: setRdStatus,
    onDecStatus: setDecStatus,
    onRdChain: setRdChain,
    onDecChain: setDecChain,
    onRdStageData: setRdStageData,
    onDecStageData: setDecStageData,
    onRdPipelineTime: setRdPipelineTime,
    onDecPipelineTime: setDecPipelineTime,
  };

  return (
    <div className="omega-terminal" style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <StatusStrip
        rdStatus={rdStatus}
        decStatus={decStatus}
        chainRoot={rdChain?.rootHash || decChain?.rootHash}
        clock={clock}
        rdPipelineTime={rdPipelineTime}
        decPipelineTime={decPipelineTime}
      />
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <NavigationRail
          activePanel={activePanel}
          onSelect={setActivePanel}
          panels={PANELS}
          collapsed={railCollapsed}
          onToggleCollapse={() => setRailCollapsed((c) => !c)}
        />
        <main style={{ flex: 1, overflow: "auto", padding: "clamp(16px, 4vw, 36px)" }}>
          {activePanel === "engines" && <EnginePanel {...engineProps} />}
          {activePanel === "design" && <OmegaTrustTerminalDesign />}
          {activePanel === "trust" && <TrustStackPanel rdChain={rdChain} decChain={decChain} />}
          {activePanel === "integrity" && (
            <IntegrityConsole
              rdChain={rdChain}
              decChain={decChain}
              rdStageData={rdStageData}
              decStageData={decStageData}
              onVerify={emitSignal}
            />
          )}
          {activePanel === "signals" && <SignalsFeed signals={signals} />}
        </main>
      </div>
    </div>
  );
}
