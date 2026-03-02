/**
 * Model Adapter v0 Types
 * 
 * Types for LLM adapter v0.
 * 
 * Version: 1.0.0
 */

import { Request } from '../../contracts/types/Request';
import { CanonicalRepresentation } from '../../contracts/types/Repr';
import { ConceptCard } from '../../contracts/types/ConceptCard';
import { VerifierResult } from '../../verifier/v0/types';
import { Program } from '../../dsl/v0/types';

/**
 * Concept Shortlist Entry.
 */
export interface ConceptShortlistEntry {
  /** Concept ID */
  concept_id: string;
  /** Concept version */
  concept_version: string;
  /** Template DSL */
  template_dsl: string;
  /** Signature keys */
  signature_keys: string[];
}

/**
 * Propose Program Input.
 */
export interface ProposeProgramInput {
  /** Request */
  request: Request;
  /** Canonical representation */
  repr: CanonicalRepresentation;
  /** Concept shortlist */
  concept_shortlist: ConceptShortlistEntry[];
  /** Budgets */
  budgets: {
    max_candidates: number;
    max_tokens: number;
  };
}

/**
 * Proposed Candidate.
 */
export interface ProposedCandidate {
  /** DSL source */
  dsl: string;
  /** Expected invariants (advisory) */
  expected_invariants?: string[];
  /** Rationale tags (advisory) */
  rationale_tags?: string[];
}

/**
 * Propose Program Output.
 */
export interface ProposeProgramOutput {
  /** Proposed candidates */
  candidates: ProposedCandidate[];
  /** Temperature ID */
  temperature_id: 'low' | 'med' | 'high';
}

/**
 * Repair Program Input.
 */
export interface RepairProgramInput {
  /** Failure trace summary */
  failure_trace: {
    highest_tier_passed: number;
    why_failed?: string;
    failure_details?: Record<string, any>;
    cost_breakdown?: Record<string, number>;
  };
  /** Canonical representation */
  repr: CanonicalRepresentation;
  /** Prior program */
  prior_program: {
    dsl: string;
    ast_metrics: {
      n_nodes: number;
      n_ops: number;
      n_params: number;
      n_literals: number;
    };
  };
}

/**
 * Repair Program Output.
 */
export interface RepairProgramOutput {
  /** DSL patch (preferred) */
  dsl_patch?: string | null;
  /** Full DSL (alternative) */
  dsl_full?: string | null;
}

/**
 * Annotate Input.
 */
export interface AnnotateInput {
  /** Request */
  request: Request;
  /** Canonical representation */
  repr: CanonicalRepresentation;
}

/**
 * Annotate Output.
 */
export interface AnnotateOutput {
  /** Component label hints */
  labels?: Record<string, Record<string, any>>;
}

/**
 * Model Call Log Entry.
 */
export interface ModelCallLog {
  /** Call timestamp */
  timestamp_iso: string;
  /** Model ID */
  model_id: string;
  /** Call type */
  call_type: 'propose' | 'repair' | 'annotate';
  /** Request hash (hash of request payload) */
  request_hash: string;
  /** Prompt hash (same as request_hash for v0) */
  prompt_hash: string;
  /** Response hash */
  response_hash: string;
  /** Response (stored for replay) */
  response: any;
  /** Token estimates (if available) */
  token_estimates?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  /** Latency in milliseconds */
  latency_ms?: number;
  /** Cost estimate in USD */
  cost_usd_est?: number;
}

