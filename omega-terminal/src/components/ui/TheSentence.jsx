import { T } from "../../styles/tokens";
import SectionLabel from "./SectionLabel";

export default function TheSentence({ text, label, color, hash, time }) {
  return (
    <div style={{
      padding: "20px 24px",
      borderRadius: T.r3,
      background: `linear-gradient(170deg, ${color}08 0%, ${T.bg1} 40%, ${T.bg0} 100%)`,
      border: `1px solid ${color}25`,
      boxShadow: T.shadowGlow(color),
      animation: "subtlePulse 4s ease infinite",
    }}>
      <SectionLabel color={color} style={{ marginBottom: 14, letterSpacing: "0.18em" }}>{label}</SectionLabel>
      <div style={{
        fontSize: "clamp(15px, 3vw, 19px)",
        lineHeight: 1.9,
        color: T.text0,
        fontFamily: T.fontDisplay,
        fontStyle: "italic",
        fontWeight: 400,
      }}>{text}</div>
      {(hash || time) && (
        <div style={{
          marginTop: 14, display: "flex", gap: 12,
          fontSize: 10, color: T.text3, fontFamily: T.fontMono,
        }}>
          {hash && <span>Chain: {hash}</span>}
          {time && <span>{time}s</span>}
        </div>
      )}
    </div>
  );
}
