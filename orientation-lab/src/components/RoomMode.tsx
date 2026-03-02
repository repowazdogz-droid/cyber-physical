import { useEffect, useMemo, useState } from "react";
import type { OrientationState } from "../types/orientation";
import { ROOM_STEPS, filterPromptsByStep, getRoomPrompts } from "../utils/roomMode";
import type { RoomStep } from "../utils/roomMode";
import { buildSignals } from "../utils/signals";
import { Button, Card, Chip, Divider } from "./ui";
import { useTimer } from "../hooks/useTimer";

function stepHelp(step: RoomStep): string {
  if (step === "capture") return "Capture structure. No solutions yet.";
  if (step === "discriminate") return "Name what evidence would separate stories.";
  return "Assign ownership as roles. Clarify which judgment is required.";
}

export function RoomMode({
  title,
  state,
  onExit,
}: {
  title: string;
  state: OrientationState;
  onExit: () => void;
}) {
  const [step, setStep] = useState<RoomStep>("capture");
  const [idx, setIdx] = useState(0);
  const timer = useTimer();

  const allPrompts = useMemo(() => getRoomPrompts(state), [state]);
  const prompts = useMemo(() => filterPromptsByStep(allPrompts, step), [allPrompts, step]);

  const prompt = prompts[idx % Math.max(1, prompts.length)];
  const sig = useMemo(() => buildSignals(state), [state]);

  const nextPrompt = () => setIdx((x) => x + 1);

  // ESC key to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onExit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExit]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0b0d12",
        color: "#fff",
        zIndex: 9999,
        overflow: "auto",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: 0.8, textTransform: "uppercase", color: "rgba(255,255,255,.7)" }}>
              Room mode
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>{title}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.75)", marginTop: 6 }}>
              {stepHelp(step)}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
            <Button onClick={onExit}>Exit</Button>
          </div>
        </div>

        <Divider />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {ROOM_STEPS.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setStep(s.id);
                setIdx(0);
              }}
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,.18)",
                background: s.id === step ? "rgba(255,255,255,.14)" : "transparent",
                color: "white",
                cursor: "pointer",
              }}
            >
              {s.label}
            </button>
          ))}

          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <Chip>Models {sig.counts.models}</Chip>
            <Chip>Assumptions {sig.counts.assumptions}</Chip>
            <Chip>Disagreements {sig.counts.disagreements}</Chip>
            <Chip>Unknowns {sig.counts.unknowns}</Chip>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 14, marginTop: 14 }}>
          <div>
            <Card
              title={prompt ? prompt.title : "No prompts"}
              right={
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Button onClick={nextPrompt}>Next prompt</Button>
                </div>
              }
            >
              <div style={{ fontSize: 16, lineHeight: 1.5, color: "#111" }}>
                {prompt ? prompt.body : "No prompt available for this step."}
              </div>

              <Divider />

              <div style={{ fontSize: 12, color: "#666" }}>
                Boundary: This mode does not forecast, optimise, or recommend actions. It helps a room surface structure and own judgment.
              </div>
            </Card>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <Card title="Timer (optional)">
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{timer.mmss}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{timer.running ? "running" : "stopped"}</div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                <button onClick={() => timer.start(5)} style={miniBtn()}>
                  5 min
                </button>
                <button onClick={() => timer.start(10)} style={miniBtn()}>
                  10 min
                </button>
                <button onClick={() => timer.start(15)} style={miniBtn()}>
                  15 min
                </button>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                <button onClick={timer.pause} style={miniBtn()}>
                  Pause
                </button>
                <button onClick={timer.resume} style={miniBtn()}>
                  Resume
                </button>
                <button onClick={timer.reset} style={miniBtn()}>
                  Reset
                </button>
              </div>

              <Divider />

              <div style={{ fontSize: 12, color: "#666" }}>
                Use to timebox capture. The goal is to keep the room moving, not to "finish the truth".
              </div>
            </Card>

            <Card title="Signals (structure only)">
              {sig.items.length === 0 ? (
                <div style={{ fontSize: 12, color: "#666" }}>(No signals)</div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {sig.items.slice(0, 6).map((it) => (
                    <div key={it.id} style={{ display: "grid", gap: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={pill(it.level)}>{it.level}</span>
                        <div style={{ fontWeight: 700 }}>{it.title}</div>
                      </div>
                      <div style={{ fontSize: 12, color: "#444" }}>{it.detail}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        <div style={{ marginTop: 18, fontSize: 12, color: "rgba(255,255,255,.6)" }}>
          Tip: Share link copies the state. Room Mode is just a facilitation view — it doesn't change the structure itself.
        </div>
      </div>
    </div>
  );
}

function miniBtn(): React.CSSProperties {
  return {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #ddd",
    background: "#fff",
    cursor: "pointer",
  };
}

function pill(level: "note" | "attention"): React.CSSProperties {
  return {
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 999,
    border: "1px solid #ddd",
    background: level === "attention" ? "#fff2f2" : "#f7f7f7",
  };
}

