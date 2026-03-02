/**
 * Contract Version
 * 
 * Central versioning for all interface contracts.
 * Breaking vs non-breaking change rules.
 * 
 * Version: 1.0.0
 */

/**
 * Current contract version.
 * All contracts must declare compatibility with this version.
 */
export const CONTRACT_VERSION = "1.0.0";

/**
 * Breaking changes (require adapter/kernel updates):
 * - Removing required fields
 * - Changing field types (e.g., string → number)
 * - Changing enum values
 * - Removing enum values
 * - Changing array bounds (making them stricter)
 * 
 * Non-breaking changes (backward compatible):
 * - Adding optional fields
 * - Adding new enum values
 * - Relaxing array bounds (making them larger)
 * - Adding new contract types
 * - Adding documentation/comments
 * 
 * Adapter compatibility:
 * - Adapters must declare: `contractVersion: "1.0.0"`
 * - Kernels must declare: `contractVersion: "1.0.0"`
 * - Mismatched versions trigger validation warnings
 */








































