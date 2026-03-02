import { useState } from "react";
import { T } from "../../styles/tokens";

export default function Card({ children, borderColor, glowColor, style, onClick, hoverable }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hoverable && setHovered(true)}
      onMouseLeave={() => hoverable && setHovered(false)}
      style={{
        background: hovered ? T.bg3 : T.bg2,
        border: `1px solid ${borderColor || T.border1}`,
        borderRadius: T.r2,
        padding: "14px 16px",
        marginBottom: T.space(2),
        transition: "all 0.2s ease",
        cursor: onClick ? "pointer" : "default",
        boxShadow: glowColor && hovered ? T.shadowGlow(glowColor) : T.shadow1,
        ...style,
      }}
    >{children}</div>
  );
}
