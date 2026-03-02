import { T } from "../../styles/tokens";

export default function Badge({ children, color, glow, large }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: large ? 11 : 9, fontWeight: 600,
      fontFamily: T.fontMono, letterSpacing: "0.06em",
      color, background: glow || `${color}11`,
      border: `1px solid ${color}33`,
      borderRadius: 4, padding: large ? "4px 10px" : "2px 7px",
    }}>{children}</span>
  );
}
