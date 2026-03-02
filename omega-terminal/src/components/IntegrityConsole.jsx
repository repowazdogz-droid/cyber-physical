import { useState } from "react";
import { computeMerkleChain } from "../utils/crypto";

const PROTOCOLS_RD = ["PDP-2.0", "LSP-2.0", "HGP-2.0", "EDP-2.0", "VGP-2.0"];
const PROTOCOLS_DEC = ["SAP-1.0", "OAP-1.0", "RGP-1.0", "BBP-1.0"];

export default function IntegrityConsole({ rdChain, decChain, rdStageData, decStageData, onVerify }) {
  const [reverifyResult, setReverifyResult] = useState(null);

  const handleReverify = async () => {
    setReverifyResult(null);
    const results = {};
    if (rdStageData && rdStageData.length > 0) {
      try {
        const chain = await computeMerkleChain(rdStageData);
        results.rd = { computed: chain.rootHash, stored: rdChain?.rootHash, match: !!rdChain && chain.rootHash === rdChain.rootHash };
      } catch (e) {
        results.rd = { error: e.message };
      }
    }
    if (decStageData && decStageData.length > 0) {
      try {
        const chain = await computeMerkleChain(decStageData);
        results.dec = { computed: chain.rootHash, stored: decChain?.rootHash, match: !!decChain && chain.rootHash === decChain.rootHash };
      } catch (e) {
        results.dec = { error: e.message };
      }
    }
    setReverifyResult(results);
    onVerify?.({ message: "Re-verification run", severity: "info", payload: results });
  };

  const canReverify = (rdStageData && rdStageData.length > 0) || (decStageData && decStageData.length > 0);

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20 }}>INTEGRITY CONSOLE</div>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 24 }}>
        Hash verification and chain inspection. Recompute hashes from stage data to detect tampering.
      </p>

      <div style={{ display: "grid", gap: 24 }}>
        <div style={{ padding: "16px 20px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 12 }}>R&D ENGINE CHAIN</div>
          {rdChain ? (
            <>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>Root hash: <span style={{ fontFamily: "var(--font-mono)", color: "var(--green)", wordBreak: "break-all" }}>{rdChain.rootHash}</span></div>
              <div style={{ marginTop: 10 }}>
                {rdChain.stageHashes?.map((h, i) => (
                  <div key={i} style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-dim)", marginBottom: 4, wordBreak: "break-all" }}>
                    {PROTOCOLS_RD[i] || "S" + (i + 1)}: {h}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: "var(--text-dim)" }}>No chain yet. Run R&D pipeline.</div>
          )}
        </div>

        <div style={{ padding: "16px 20px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 12 }}>DECISION ENGINE CHAIN</div>
          {decChain ? (
            <>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>Root hash: <span style={{ fontFamily: "var(--font-mono)", color: "var(--green)", wordBreak: "break-all" }}>{decChain.rootHash}</span></div>
              <div style={{ marginTop: 10 }}>
                {decChain.stageHashes?.map((h, i) => (
                  <div key={i} style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-dim)", marginBottom: 4, wordBreak: "break-all" }}>
                    {PROTOCOLS_DEC[i] || "S" + (i + 1)}: {h}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: "var(--text-dim)" }}>No chain yet. Run Decision pipeline.</div>
          )}
        </div>

        <div style={{ padding: "14px 18px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 10 }}>RE-VERIFY</div>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>Recompute chain from stage outputs and compare to stored root. Run R&D or Decision pipeline first to populate stage data.</p>
          <button
            onClick={handleReverify}
            disabled={!canReverify}
            style={{
              padding: "10px 18px",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              background: canReverify ? "var(--green)" : "var(--bg-hover)",
              color: canReverify ? "#0c0c10" : "var(--text-dim)",
              border: "none",
              borderRadius: 6,
              cursor: canReverify ? "pointer" : "not-allowed",
            }}
          >
            RE-VERIFY CHAINS
          </button>
          {reverifyResult && (
            <div style={{ fontSize: 12, marginTop: 12, padding: "10px 14px", background: "var(--bg-hover)", borderRadius: 6 }}>
              {reverifyResult.rd && (reverifyResult.rd.error ? <div style={{ color: "var(--red)" }}>R&D: {reverifyResult.rd.error}</div> : <div style={{ color: reverifyResult.rd.match ? "var(--green)" : "var(--red)" }}>R&D: {reverifyResult.rd.match ? "Match" : "Mismatch"}</div>)}
              {reverifyResult.dec && (reverifyResult.dec.error ? <div style={{ color: "var(--red)" }}>DEC: {reverifyResult.dec.error}</div> : <div style={{ color: reverifyResult.dec.match ? "var(--green)" : "var(--red)" }}>DEC: {reverifyResult.dec.match ? "Match" : "Mismatch"}</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
