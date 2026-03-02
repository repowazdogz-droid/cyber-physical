/**
 * Visibility Contracts
 * 
 * Interfaces for privacy and visibility rules.
 * Adult vs minor must be explicit.
 * Opt-in must be representable.
 * 
 * Version: 1.0.0
 */

import { CONTRACT_VERSION } from './ContractVersion';

/**
 * ViewerRole: Roles that can view learner data.
 */
export enum ViewerRole {
  Learner = "Learner",
  Parent = "Parent",
  Teacher = "Teacher",
  Institution = "Institution"
}

/**
 * VisibilityRuleContract: Rule for data visibility.
 * Schema only, no policy enforcement logic.
 */
export interface VisibilityRuleContract {
  /** Contract version (must match CONTRACT_VERSION) */
  contractVersion: string;
  /** Rule ID */
  ruleId: string;
  /** Viewer role */
  viewerRole: ViewerRole;
  /** Is minor (explicit boolean) */
  isMinor: boolean;
  /** Can view (explicit boolean) */
  canView: boolean;
  /** Requires opt-in (explicit boolean) */
  requiresOptIn: boolean;
  /** Opt-in granted (optional, only if requiresOptIn is true) */
  optInGranted?: boolean;
  /** Reason (max 200 chars) */
  reason?: string;
}

/**
 * ConsentStateContract: Consent state for data sharing.
 * Explicit representation of opt-in/opt-out.
 */
export interface ConsentStateContract {
  /** Contract version (must match CONTRACT_VERSION) */
  contractVersion: string;
  /** Learner ID */
  learnerId: string;
  /** Is minor (explicit boolean) */
  isMinor: boolean;
  /** Parent consent granted (optional, only if isMinor is true) */
  parentConsentGranted?: boolean;
  /** Teacher access opt-in (explicit boolean) */
  teacherAccessOptIn: boolean;
  /** Institution access opt-in (explicit boolean) */
  institutionAccessOptIn: boolean;
  /** Consent timestamp (ISO string) */
  consentTimestamp: string;
  /** Consent version (for tracking changes) */
  consentVersion: string;
}








































