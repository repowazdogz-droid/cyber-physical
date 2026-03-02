/**
 * Degradation Modes
 * 
 * Explicit degradation policy when primary path fails.
 * No mode loops infinitely; every run ends with success or typed failure.
 * 
 * Version: 1.0.0
 */

export enum DegradationMode {
  /** Increase diversity (seed/temp band) */
  DIVERSIFY = 'diversify',
  /** Swap retrieval strategy */
  RETRIEVAL_SWAP = 'retrieval_swap',
  /** Library brute enumeration */
  ENUMERATE = 'enumerate',
  /** Return failure with trace */
  RETURN_FAILURE = 'return_failure'
}























