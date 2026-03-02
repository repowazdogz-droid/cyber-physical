import type { OrientationState } from "../types/orientation";
import { Card, Chip, Divider } from "./ui";
import { getSignals } from "../utils/signals";

export function SignalPanel({ state }: { state: OrientationState }) {
  const signals = getSignals(state);

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
        <div style={{ fontWeight: 700 }}>Orientation signals</div>
        <Chip>{signals.length ? `${signals.length} signal(s)` : "No signals"}</Chip>
      </div>

      <div style={{ marginTop: 8, color: "rgba(0,0,0,0.62)", fontSize: 13 }}>
        These are structure reflections. They don't tell the room what to do.
      </div>

      <Divider />

      {signals.length === 0 ? (
        <div style={{ fontSize: 13, color: "rgba(0,0,0,0.62)" }}>
          Nothing structural is obviously missing right now.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {signals.map((s, idx) => (
            <div key={idx} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ width: 78 }}>
                <Chip>{s.level === "attention" ? "Notice" : "Note"}</Chip>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: "rgba(0,0,0,0.70)", marginTop: 2 }}>
                  {s.detail}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
