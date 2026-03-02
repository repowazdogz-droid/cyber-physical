import { T } from "../../styles/tokens";

export default function ProtocolChip({ protocol }) {
  return (
    <span style={{
      fontSize: 9, fontFamily: T.fontMono, fontWeight: 600,
      color: `${T.mint}88`, border: `1px solid ${T.mint}22`,
      borderRadius: 3, padding: "2px 6px",
    }}>{protocol}</span>
  );
}
