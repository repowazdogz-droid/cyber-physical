/**
 * OMEGA Trust Terminal — integrity utilities: audit trails, export envelope, known limitations
 */

import { canonicalJSON, sha256 } from "./crypto.js";

export const KNOWN_LIMITATIONS_DEC = [
  "Corpus may contain low-quality or outdated sources. Source quality is not assessed.",
  "Search query generation could bias corpus toward certain domains.",
  "Strategic assessment and options depend on model reasoning within constrained corpus, not independent expert review.",
  "Integrity is tamper-evident (hash-based), not identity-signed (no asymmetric cryptography).",
  "Corpus assembly uses model-mediated search. Results are not independently fetched from URLs.",
  "Board brief numeric thresholds from LLM generation are estimates unless linked to empirical data.",
];

/**
 * Build export envelope with _integrity block. verification is "PASS" when both engines have chain data.
 */
export async function buildExportEnvelope(rdMeta, decMeta, rdStageData, decStageData, rdMerkle, decMerkle) {
  const rd = {
    meta: rdMeta || {},
    stageData: rdStageData || [],
    chain: rdMerkle ? { rootHash: rdMerkle.rootHash, stageHashes: rdMerkle.stageHashes } : null,
  };
  const dec = {
    meta: decMeta || {},
    stageData: decStageData || [],
    chain: decMerkle ? { rootHash: decMerkle.rootHash, stageHashes: decMerkle.stageHashes } : null,
  };
  const payload = { rd, dec };
  const rdOk = rdMerkle?.rootHash && Array.isArray(rdStageData) && rdStageData.length > 0;
  const decOk = decMerkle?.rootHash && Array.isArray(decStageData) && decStageData.length > 0;
  const verification = (rdOk && decOk) ? "PASS" : "PARTIAL";
  const integrityPayload = { ...payload, _integrity: { verification, exportedAt: new Date().toISOString() } };
  const envelopeHash = await sha256(canonicalJSON(integrityPayload));
  return { ...integrityPayload, _integrity: { ...integrityPayload._integrity, envelopeHash } };
}
