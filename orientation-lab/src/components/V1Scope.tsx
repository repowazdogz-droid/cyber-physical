import { Card } from "./ui";

export function V1Scope() {
  return (
    <Card title="Orientation Lab — v1 scope">
      <ul style={{ fontSize: 13, lineHeight: 1.5, margin: 0, paddingLeft: 20 }}>
        <li>Captures structure under uncertainty</li>
        <li>Makes disagreements, assumptions, and unknowns explicit</li>
        <li>Produces shareable orientation artifacts</li>
      </ul>
      <div style={{ height: 1, background: "#eee", margin: "12px 0" }} />
      <ul style={{ fontSize: 13, lineHeight: 1.5, color: "#555", margin: 0, paddingLeft: 20 }}>
        <li>Does not predict outcomes</li>
        <li>Does not recommend actions</li>
        <li>Does not optimise or decide</li>
        <li>Does not replace judgment or governance</li>
      </ul>
    </Card>
  );
}

