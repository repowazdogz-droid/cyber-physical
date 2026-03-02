/**
 * Every OMEGA export is wrapped in this envelope.
 * The _integrity block makes it tamper-evident.
 */

import type { OntologyState } from '../ontology/types.js';

export interface IntegrityBlock {
  version: string;
  sealed_at: string;
  content_hash: string;
  chain: ChainLink[];
  merkle_root: string;
  known_limitations: string[];
  generation_audit: GenerationAudit;
}

export interface ChainLink {
  index: number;
  node_type:
    | 'OBSERVE'
    | 'DERIVE'
    | 'ASSUME'
    | 'DECIDE'
    | 'ACT'
    | 'VERIFY'
    | 'STAGE';
  content_hash: string;
  prev_hash: string;
  timestamp: string;
}

export interface GenerationAudit {
  model?: string;
  deterministic_modules: string[];
  llm_modules: string[];
  verification_status: 'unverified' | 'partial' | 'verified';
  verified_claims: number;
  unverified_claims: number;
  flagged_claims: number;
}

export interface ArtifactEnvelope<T = unknown> {
  artifact_id: string;
  artifact_type: string;
  schema_version: string;
  created_at: string;
  content: T;
  ontology: OntologyState;
  _integrity: IntegrityBlock;
}
