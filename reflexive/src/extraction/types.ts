export interface RawAssessment {
  conclusion: string;
  claims: RawClaim[];
  risks: string[];
  limitations: string[];
  key_assumptions: string[];
}

export interface RawClaim {
  statement?: string;
  category?: string;
  claim_kind?: string;
  confidence_weight?: number;
  evidence_basis?: string | null;
  about_entity_candidate?: string;
  as_of?: string;
  valid_from?: string | null;
  valid_until?: string | null;
}

export interface ExtractedClaim {
  id: string;                          // generated UUID
  perspective_id: string;
  analysis_id: string;
  statement: string;
  category: 'factual' | 'inferential' | 'evaluative' | 'predictive';
  claim_kind: 'claim' | 'assumption';
  confidence_weight: number;           // [0.0, 1.0]
  evidence_basis: string | null;
  evidence_status: 'supported' | 'unsupported';
  about_entity_candidate: string;
  about_entity_canonical: string | null;  // set by canonicalizer
  validity: 'strict' | 'repaired' | 'invalid';
  polarity: 'positive' | 'negative' | 'neutral' | null;  // set by polarity classifier
  scoring_eligible: boolean;
  as_of: string;
  valid_from: string | null;
  valid_until: string | null;
  expires_at: string | null;           // set if unsupported
  stale_unsupported: boolean;
  repairs: string[];                   // log of repairs applied
}

export interface ParseResult {
  success: boolean;
  assessment: RawAssessment | null;
  claims: ExtractedClaim[];
  errors: string[];
  warnings: string[];
}

export interface RepairLog {
  claim_index: number;
  field: string;
  original_value: unknown;
  repaired_value: unknown;
  rule: string;
}

export interface ValidationResult {
  tier1_pass: boolean;
  tier1_errors: string[];
  tier2_repairs: RepairLog[];
}

export interface CanonicalizationResult {
  canonical: string;
  method: 'exact' | 'normalized' | 'stimulus_match' | 'cross_claim_match' | 'fallback_extraction' | 'unresolved';
  candidate: string;
}

export interface PolarityResult {
  polarity: 'positive' | 'negative' | 'neutral';
  matched_terms: string[];
  negation_inversions: string[];
}
