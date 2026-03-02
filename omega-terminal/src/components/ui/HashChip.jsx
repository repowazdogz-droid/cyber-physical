import { T } from "../../styles/tokens";

export default function HashChip({ hash, label }) {
  return (
    <span style={{
      fontSize: 9, fontFamily: T.fontMono, fontWeight: 500,
      color: T.text3, letterSpacing: "0.02em",
      background: `${T.mint}08`, border: `1px solid ${T.mint}15`,
      borderRadius: 3, padding: "1px 6px",
    }}>{label ? `${label} ` : ""}{hash}</span>
  );
}
