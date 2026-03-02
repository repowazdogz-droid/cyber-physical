/**
 * Learning Privacy Default Policy Pack
 * 
 * Privacy policies for learning platform.
 * Ensures adult opt-in required for teacher surfaces; strips kernel trace internals.
 * 
 * Version: 1.0.0
 */

import { PolicyPack } from '../PolicyPackTypes';
import { CONTRACT_VERSION } from '../../contracts/ContractVersion';

export const learningPrivacyDefaultPack: PolicyPack = {
  contractVersion: CONTRACT_VERSION,
  descriptor: {
    id: "learning_privacy_default",
    version: "1.0.0",
    description: "Default privacy policies for learning platform. Adult opt-in required for teacher access; internal markers stripped.",
    domains: ["learning"]
  },
  overrides: [],
  disallows: [
    {
      id: "learning_disallow_teacher_access_without_optin",
      outcome: "TEACHER_ACCESS_DENIED",
      reason: "Adult learner data requires explicit opt-in for teacher access.",
      priority: 50
    }
  ],
  constraints: [
    {
      id: "learning_strip_internal_markers",
      type: "cap_text_length",
      maxValue: 0, // Special: indicates stripping, not capping
      reason: "Internal/system markers must be stripped from traces for privacy"
    },
    {
      id: "learning_cap_thought_objects",
      type: "cap_question_count", // Reusing type for thought objects
      maxValue: 50,
      reason: "Thought objects capped to 50 per board for bounded storage"
    }
  ]
};








































