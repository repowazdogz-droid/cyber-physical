/**
 * Contract Guards
 * 
 * Pure validation helpers for contract compliance.
 * Structural checks only, no side effects, no runtime branching.
 * 
 * Version: 1.0.0
 */

import { KernelDecisionContract } from './KernelContracts';
import { ThoughtObjectContract } from './ThoughtObjectContracts';
import { PolicyDecisionContract } from './PolicyContracts';
import { ClaimContract } from './ClaimContracts';
import { CONTRACT_VERSION } from './ContractVersion';

/**
 * Checks if value is a valid KernelDecisionContract.
 * Structural check only.
 */
export function isKernelDecisionContract(x: any): x is KernelDecisionContract {
  if (!x || typeof x !== 'object') {
    return false;
  }
  
  return (
    x.contractVersion === CONTRACT_VERSION &&
    typeof x.outcome === 'string' &&
    ['Low', 'Medium', 'High', 'Unknown'].includes(x.confidence) &&
    typeof x.rationale === 'string' &&
    Array.isArray(x.assumptions) &&
    Array.isArray(x.uncertainties) &&
    typeof x.kernelId === 'string' &&
    typeof x.adapterId === 'string' &&
    x.assumptions.length <= 10 &&
    x.uncertainties.length <= 10 &&
    (!x.overridesApplied || (Array.isArray(x.overridesApplied) && x.overridesApplied.length <= 5))
  );
}

/**
 * Checks if value is a valid ThoughtObjectContract.
 * Structural check only.
 */
export function isThoughtObjectContract(x: any): x is ThoughtObjectContract {
  if (!x || typeof x !== 'object') {
    return false;
  }
  
  if (x.contractVersion !== CONTRACT_VERSION) {
    return false;
  }
  
  if (typeof x.id !== 'string' || typeof x.type !== 'string' || typeof x.source !== 'string') {
    return false;
  }
  
  if (typeof x.timestamp !== 'string') {
    return false;
  }
  
  // Check content (string or structured)
  if (typeof x.content === 'string') {
    if (x.content.length > 500) {
      return false; // Bounded
    }
  } else if (x.content && typeof x.content === 'object') {
    // Structured content
    if (typeof x.content.body !== 'string' || x.content.body.length > 400) {
      return false; // Bounded
    }
    if (x.content.title && typeof x.content.title === 'string' && x.content.title.length > 100) {
      return false; // Bounded
    }
    if (x.content.items && (Array.isArray(x.content.items) && x.content.items.length > 5)) {
      return false; // Bounded
    }
  } else {
    return false;
  }
  
  return true;
}

/**
 * Checks if value is a valid PolicyDecisionContract.
 * Structural check only.
 */
export function isPolicyDecisionContract(x: any): x is PolicyDecisionContract {
  if (!x || typeof x !== 'object') {
    return false;
  }
  
  return (
    x.contractVersion === CONTRACT_VERSION &&
    typeof x.outcome === 'string' &&
    ['Low', 'Medium', 'High', 'Unknown'].includes(x.confidence) &&
    typeof x.reason === 'string' &&
    typeof x.policyId === 'string' &&
    ['allow', 'deny', 'force', 'constrain'].includes(x.decisionType) &&
    x.reason.length <= 300 &&
    (!x.claims || (Array.isArray(x.claims) && x.claims.length <= 5)) &&
    (!x.nextActions || (Array.isArray(x.nextActions) && x.nextActions.length <= 5))
  );
}

/**
 * Checks if value is a valid ClaimContract.
 * Structural check only.
 */
export function isClaimContract(x: any): x is ClaimContract {
  if (!x || typeof x !== 'object') {
    return false;
  }
  
  return (
    x.contractVersion === CONTRACT_VERSION &&
    typeof x.type === 'string' &&
    typeof x.statement === 'string' &&
    ['Low', 'Medium', 'High', 'Unknown'].includes(x.confidence) &&
    typeof x.claimId === 'string' &&
    x.statement.length <= 200 &&
    (!x.evidence || (Array.isArray(x.evidence) && x.evidence.length <= 5))
  );
}








































