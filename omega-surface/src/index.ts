/**
 * OMEGA Surface Standard — Public API
 *
 * Shared ontology, artifact envelope, Room/Terminal surfaces, post-hoc verification.
 */

// Ontology
export type {
  OntologyLayer,
  OntologyState,
  StructureItem,
  ConstraintItem,
  UncertaintyItem,
  AssumptionItem,
} from './ontology/types.js';
export {
  classifyToOntologyState,
  type ClassifiableItem,
} from './ontology/classify.js';

// Artifact
export type {
  ArtifactEnvelope,
  IntegrityBlock,
  ChainLink,
  GenerationAudit,
} from './artifact/types.js';
export { canonicalise } from './artifact/canonical.js';
export { sha256, buildChain, merkleRoot, type ChainItem } from './artifact/hash.js';
export {
  createEnvelope,
  sealEnvelope,
  verifyEnvelope,
  type UnsealedEnvelope,
  type ChainItemInput,
} from './artifact/envelope.js';

// Surface
export type {
  RoomSurface,
  RoomPreset,
  TerminalSurface,
  TerminalStage,
} from './surface/types.js';
export { createRoomSurface } from './surface/room.js';
export { createTerminalSurface } from './surface/terminal.js';

// Verification
export type { VerificationResult, ClaimStatus } from './verification/types.js';
export {
  verifyClaimsPostHoc,
  type Claim,
  type PostHocSummary,
} from './verification/post-hoc.js';
export {
  recomputeChain,
  detectTamper,
  type RecomputeResult,
} from './verification/integrity-check.js';

// Export
export { exportAsJson, exportAsJsonPretty } from './export/json.js';
export { exportAsHtml } from './export/html.js';
export { exportAsPdf } from './export/pdf.js';
