import type { OrientationState } from "../types/orientation";
import { buildSignals } from "../utils/signals";
import { Card, Divider } from "./ui";

export function FacilitatorNotes({ state }: { state: OrientationState }) {
  const sig = buildSignals(state);
  return (
    <Card title="Facilitator notes (read-only)">
      <div style={{ fontSize: 13, lineHeight: 1.6 }}>
        <p><b>Purpose:</b> Keep the room oriented. No solutions, no scoring.</p>
        <ul>
          <li>Open with models. Delay debate.</li>
          <li>Translate disagreement into discriminators.</li>
          <li>Name unknowns with impact + horizon.</li>
          <li>Close by assigning ownership as roles.</li>
        </ul>
        <Divider />
        <p><b>Structural signals:</b></p>
        <ul>
          {sig.items.slice(0, 6).map(s => (
            <li key={s.id}><b>{s.title}:</b> {s.detail}</li>
          ))}
        </ul>
        <Divider />
        <p style={{ color: "#666" }}>
          Boundary: This process does not forecast, optimise, or recommend actions.
        </p>
      </div>
    </Card>
  );
}

