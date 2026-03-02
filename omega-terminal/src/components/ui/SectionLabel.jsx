import { T } from "../../styles/tokens";

export default function SectionLabel({ children, color = T.text2, style }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, fontFamily: T.fontMono,
      letterSpacing: "0.14em", color, textTransform: "uppercase",
      marginBottom: T.space(3), ...style,
    }}>{children}</div>
  );
}
