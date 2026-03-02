/**
 * Artifact Kind Enums
 * 
 * Types of artifacts in the OPLAS system.
 * 
 * Version: 1.0.0
 */

export enum ArtifactKind {
  /** Raw input (not yet hashed) */
  RAW_INPUT = 'raw_input',
  /** Canonical representation */
  REPR = 'repr',
  /** DSL program */
  PROGRAM = 'program',
  /** Verifier trace */
  TRACE = 'trace',
  /** Concept card */
  CONCEPT_CARD = 'concept_card',
  /** Claim */
  CLAIM = 'claim',
  /** Derived artifact */
  DERIVED = 'derived'
}























