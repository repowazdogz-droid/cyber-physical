/**
 * Vault v0 Types
 * 
 * Types for concept vault v0.
 * 
 * Version: 1.0.0
 */

import { ConceptCard } from '../../contracts/types/ConceptCard';
import { CanonicalRepresentation } from '../../contracts/types/Repr';
import { Request } from '../../contracts/types/Request';
import { Program } from '../../dsl/v0/types';
import { VerifierResult } from '../../verifier/v0/types';

/**
 * Retrieval mode.
 */
export enum RetrievalMode {
  /** Symbolic keys only (deterministic, default) */
  SYMBOLIC_ONLY = 'SYMBOLIC_ONLY',
  /** Hybrid: symbolic + learned embedding tie-break */
  HYBRID = 'HYBRID'
}

/**
 * Concept Retrieval Result.
 */
export interface ConceptRetrievalResult {
  /** Retrieved concepts */
  concepts: ConceptCard[];
  /** Keys used for retrieval */
  keys_used: string[];
  /** Concept IDs retrieved */
  concept_ids: string[];
  /** Similarity scores (if hybrid mode) */
  similarities?: Record<string, number>;
  /** Retrieval mode used */
  retrieval_mode?: RetrievalMode;
}

/**
 * Concept Instantiation Result.
 */
export interface ConceptInstantiationResult {
  /** Success flag */
  ok: boolean;
  /** Instantiated program (if ok) */
  program?: Program;
  /** Source concept */
  concept?: ConceptCard;
  /** Errors (if not ok) */
  errors?: string[];
}

/**
 * Negative Evidence Record.
 */
export interface NegativeEvidence {
  /** Concept ID */
  concept_id: string;
  /** Concept version */
  concept_version: string;
  /** Representation ID */
  repr_id: string;
  /** Failure tier */
  failure_tier: number;
  /** Why code */
  why_code: string;
  /** Trace ID */
  trace_id: string;
  /** Timestamp */
  timestamp_iso: string;
}

/**
 * Audit Commit Entry.
 */
export interface AuditCommit {
  /** Commit timestamp */
  timestamp_iso: string;
  /** Action */
  action: 'write_back' | 'deprecate' | 'fork_version' | 'negative_evidence';
  /** Concept ID */
  concept_id: string;
  /** Concept version */
  concept_version: string;
  /** Details */
  details: Record<string, any>;
}

