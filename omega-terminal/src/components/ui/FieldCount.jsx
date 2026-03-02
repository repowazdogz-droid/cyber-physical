import { T } from "../../styles/tokens";

export default function FieldCount({ count, color }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, fontFamily: T.fontMono,
      color: color || `${T.mint}99`,
    }}>{count}</span>
  );
}
