import React from "react";
import type { OrientationState } from "../types/orientation";
import { buildArtifactText } from "../utils/artifactPack";

export function ArtifactView({ state }: { state: OrientationState }) {
  const text = buildArtifactText(state);

  return (
    <div style={wrap}>
      <pre style={pre}>{text}</pre>

      <div style={fine}>
        Currently used as a thinking tool, not an operational system.
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = {
  border: "1px solid rgba(0,0,0,0.12)",
  borderRadius: 10,
  padding: 14,
  background: "#fff",
};

const pre: React.CSSProperties = {
  width: "100%",
  overflowX: "auto",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  padding: 12,
  borderRadius: 8,
  border: "1px solid #eee",
  background: "#fafafa",
  fontSize: 13,
  lineHeight: 1.5,
  color: "#111",
};

const fine: React.CSSProperties = {
  marginTop: 10,
  fontSize: 12,
  color: "#666",
  fontStyle: "italic",
};

