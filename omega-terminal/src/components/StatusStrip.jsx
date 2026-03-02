export default function StatusStrip({ rdStatus, decStatus, chainRoot, clock, rdPipelineTime, decPipelineTime }) {
  const dot = (status) => {
    const color = status === "running" || status === "retrying" ? "#f59e0b" : status === "done" ? "#4ade80" : status === "error" ? "#f87171" : "#40404e";
    return { width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 };
  };
  const label = (status) => status === "running" ? "RUNNING" : status === "retrying" ? "RETRY" : status === "done" ? "DONE" : status === "error" ? "ERROR" : "IDLE";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
        padding: "10px clamp(16px, 4vw, 36px)",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-primary)",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.1em",
        color: "var(--text-muted)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: 14, color: "var(--green)" }}>Ω</span>
        <span style={{ color: "var(--text-primary)" }}>OMEGA TRUST TERMINAL</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={dot(rdStatus)} />
          <span>R&D: {label(rdStatus)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={dot(decStatus)} />
          <span>DEC: {label(decStatus)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: "var(--text-dim)" }}>⟐ Chain:</span>
          <span style={{ fontFamily: "var(--font-mono)", color: chainRoot ? "var(--green)" : "var(--text-dim)", wordBreak: "break-all" }}>
            {chainRoot ? chainRoot.substring(0, 16) : "—"}
          </span>
        </div>
        {(rdPipelineTime != null || decPipelineTime != null) && (
          <span style={{ color: "var(--amber)" }}>
            {rdPipelineTime != null && `${rdPipelineTime}s R&D`}
            {rdPipelineTime != null && decPipelineTime != null && " | "}
            {decPipelineTime != null && `${decPipelineTime}s DEC`}
          </span>
        )}
        <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>{clock}</span>
      </div>
    </div>
  );
}
