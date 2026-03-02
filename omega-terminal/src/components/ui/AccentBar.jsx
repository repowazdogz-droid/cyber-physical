import { T } from "../../styles/tokens";

export default function AccentBar({ color, children, style }) {
  return (
    <div style={{
      borderLeft: `3px solid ${color}`,
      paddingLeft: 14,
      marginBottom: T.space(3),
      ...style,
    }}>{children}</div>
  );
}
