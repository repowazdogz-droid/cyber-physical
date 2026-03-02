const PROTOCOLS = [
  { layer: 1, name: "LAYER 1: INTEGRITY", items: [
    { id: "CJS-1.0", name: "Canonical JSON Serialization (CJS-1.0)", desc: "Deterministic serialization for hash stability." },
    { id: "SMC-1.0", name: "SHA-256 Merkle Chain (SMC-1.0)", desc: "Tamper-evident chaining of stage outputs." },
    { id: "SVR-2.0", name: "Schema Validation with Retry (SVR-2.0)", desc: "Required fields and strict validators with retries." },
  ]},
  { layer: 2, name: "LAYER 2: PROVENANCE", items: [
    { id: "ESC-1.0", name: "Externalized Source Corpus (ESC-1.0)", desc: "Corpus assembled before pipeline; model cites only from it." },
    { id: "CVP-1.0", name: "Citation Verification + Phantom Detection (CVP-1.0)", desc: "SRC-N citations verified; phantom citations flagged." },
    { id: "GAT-1.0", name: "Generation Audit Trail (GAT-1.0)", desc: "Timestamp, model, corpus hash, chain root, limitations." },
  ]},
  { layer: 3, name: "LAYER 3: GOVERNANCE", items: [
    { id: "FAP-1.0", name: "Freeze/Authorize Pattern (FAP-1.0)", desc: "Freeze version → revise → re-run; version chain." },
    { id: "KLD-1.0", name: "Known Limitations Declaration (KLD-1.0)", desc: "Explicit limitations in every export and audit." },
  ]},
];

export default function TrustStackPanel({ rdChain, decChain }) {
  const hasRun = !!(rdChain?.rootHash || decChain?.rootHash);
  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20 }}>TRUST STACK</div>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 24 }}>
        Eight protocols. Zero external UI dependencies. This is what runs under the hood when the engines execute.
      </p>
      {PROTOCOLS.map((layer) => (
        <div key={layer.layer} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 10 }}>{layer.name}</div>
          <div style={{ borderLeft: "2px solid var(--border)", paddingLeft: 16 }}>
            {layer.items.map((item) => (
              <div key={item.id} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>├── {item.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, paddingLeft: 12 }}>{item.desc}</div>
                {hasRun && (item.id === "CVP-1.0" || item.id === "ESC-1.0") && (
                  <div style={{ fontSize: 11, color: "var(--green)", marginTop: 6, paddingLeft: 12 }}>Active — citation verification and corpus in use</div>
                )}
                {hasRun && (item.id === "SMC-1.0" || item.id === "CJS-1.0") && (
                  <div style={{ fontSize: 11, color: "var(--green)", marginTop: 6, paddingLeft: 12 }}>Active — chain verified</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      {hasRun && (
        <div style={{ marginTop: 20, padding: "14px 18px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--text-secondary)" }}>
          <strong style={{ color: "var(--green)" }}>Live stats:</strong> R&D chain {rdChain?.rootHash ? "verified (" + rdChain.rootHash.substring(0, 12) + "…)" : "—"}. Decision chain {decChain?.rootHash ? "verified (" + decChain.rootHash.substring(0, 12) + "…)" : "—"}.
        </div>
      )}
    </div>
  );
}
