/**
 * Filtered Examples
 * 
 * Examples demonstrating visibility filtering for different roles.
 * 
 * Version: 0.1
 */

import {
  getVisibilityPolicy,
  filterSessionForViewer,
  filterLearnerStateForViewer
} from "../VisibilityFilters";
import {
  StoredSessionRecord,
  StoredLearnerState
} from "../StoreTypes";
import { AgeBand } from "../../LearnerTypes";
import { createEmptySkillGraph } from "../../SkillGraphTypes";

/**
 * Example: Minor viewed as Parent
 */
export function minorViewedAsParentExample() {
  const profile = {
    learnerId: "minor-learner-1",
    ageBand: AgeBand.SIX_TO_NINE,
    safety: {
      minor: true,
      institutionMode: false
    }
  };
  
  const policy = getVisibilityPolicy(profile);
  
  const session: StoredSessionRecord = {
    sessionId: "session-1",
    learnerId: profile.learnerId,
    goal: {
      subject: "mathematics",
      topic: "fractions",
      objective: "understand how to add fractions"
    },
    tutorTurns: [
      {
        turnNumber: 1,
        learnerUtterance: "I want to learn about fractions",
        tutorMessage: "Let's start by making sure I understand your goal. What are you trying to learn or figure out?",
        tutorQuestions: ["What are you trying to learn or figure out?"],
        scaffoldStep: "ClarifyGoal" as any,
        timestamp: "2024-12-13T10:30:00.000Z"
      },
      {
        turnNumber: 2,
        learnerUtterance: "I want to add 1/2 + 1/3",
        tutorMessage: "Before we dive in, I'd like to understand what you already know. What do you already know about this topic?",
        tutorQuestions: ["What do you already know about this topic?"],
        scaffoldStep: "ElicitPriorKnowledge" as any,
        timestamp: "2024-12-13T10:31:00.000Z"
      }
    ],
    observations: [
      {
        type: "AskedClarifyingQuestion",
        timestamp: "2024-12-13T10:30:00.000Z",
        strength: 0.8,
        sessionId: "session-1"
      }
    ],
    sessionTrace: {
      timestampIso: "2024-12-13T10:30:00.000Z",
      inputsHash: "test-hash",
      contractsVersion: "0.1",
      sessionId: "session-1",
      learnerId: profile.learnerId,
      refusals: [],
      notes: ["Skill updates: 1 skill updated"],
      turnCount: 2,
      assessmentGenerated: false,
      skillUpdatesCount: 1
    },
    createdAtIso: "2024-12-13T10:30:00.000Z"
  };
  
  const filtered = filterSessionForViewer(session, "Parent", policy);
  
  console.log("=== Minor Viewed as Parent ===");
  console.log(JSON.stringify(filtered, null, 2));
  
  return filtered;
}

/**
 * Example: Adult viewed as Teacher (should be redacted unless opt-in)
 */
export function adultViewedAsTeacherExample() {
  const profile = {
    learnerId: "adult-learner-1",
    ageBand: AgeBand.ADULT,
    safety: {
      minor: false,
      institutionMode: false
    }
  };
  
  // Default: no opt-in
  const policyNoOptIn = getVisibilityPolicy(profile, false);
  
  // With opt-in
  const policyWithOptIn = getVisibilityPolicy(profile, true);
  
  const session: StoredSessionRecord = {
    sessionId: "session-2",
    learnerId: profile.learnerId,
    goal: {
      subject: "mathematics",
      topic: "calculus",
      objective: "understand derivatives"
    },
    tutorTurns: [
      {
        turnNumber: 1,
        learnerUtterance: "I'm struggling with derivatives",
        tutorMessage: "Let's start by making sure I understand your goal. What are you trying to learn or figure out?",
        tutorQuestions: ["What are you trying to learn or figure out?"],
        scaffoldStep: "ClarifyGoal" as any,
        timestamp: "2024-12-13T11:00:00.000Z"
      }
    ],
    observations: [
      {
        type: "StatedUncertainty",
        timestamp: "2024-12-13T11:00:00.000Z",
        strength: 0.9,
        sessionId: "session-2"
      }
    ],
    sessionTrace: {
      timestampIso: "2024-12-13T11:00:00.000Z",
      inputsHash: "test-hash-2",
      contractsVersion: "0.1",
      sessionId: "session-2",
      learnerId: profile.learnerId,
      refusals: [],
      notes: [],
      turnCount: 1,
      assessmentGenerated: false,
      skillUpdatesCount: 0
    },
    createdAtIso: "2024-12-13T11:00:00.000Z"
  };
  
  const filteredNoOptIn = filterSessionForViewer(session, "Teacher", policyNoOptIn);
  const filteredWithOptIn = filterSessionForViewer(session, "Teacher", policyWithOptIn);
  
  console.log("=== Adult Viewed as Teacher (No Opt-In) ===");
  console.log(JSON.stringify(filteredNoOptIn, null, 2));
  
  console.log("\n=== Adult Viewed as Teacher (With Opt-In) ===");
  console.log(JSON.stringify(filteredWithOptIn, null, 2));
  
  return { filteredNoOptIn, filteredWithOptIn };
}

/**
 * Example: Learner state filtering
 */
export function learnerStateFilteringExample() {
  const minorProfile = {
    learnerId: "minor-learner-2",
    ageBand: AgeBand.TEN_TO_TWELVE,
    safety: {
      minor: true,
      institutionMode: false
    }
  };
  
  const adultProfile = {
    learnerId: "adult-learner-2",
    ageBand: AgeBand.ADULT,
    safety: {
      minor: false,
      institutionMode: false
    }
  };
  
  const minorState: StoredLearnerState = {
    learnerProfile: minorProfile,
    skillGraph: createEmptySkillGraph(minorProfile.learnerId),
    version: "0.1"
  };
  
  const adultState: StoredLearnerState = {
    learnerProfile: adultProfile,
    skillGraph: createEmptySkillGraph(adultProfile.learnerId),
    version: "0.1"
  };
  
  const minorPolicy = getVisibilityPolicy(minorProfile);
  const adultPolicy = getVisibilityPolicy(adultProfile, false);
  
  const minorFilteredForParent = filterLearnerStateForViewer(minorState, "Parent", minorPolicy);
  const adultFilteredForTeacher = filterLearnerStateForViewer(adultState, "Teacher", adultPolicy);
  
  console.log("=== Minor State Viewed as Parent ===");
  console.log(JSON.stringify(minorFilteredForParent, null, 2));
  
  console.log("\n=== Adult State Viewed as Teacher (No Opt-In) ===");
  console.log(JSON.stringify(adultFilteredForTeacher, null, 2));
  
  return { minorFilteredForParent, adultFilteredForTeacher };
}

// Uncomment to run:
// minorViewedAsParentExample();
// adultViewedAsTeacherExample();
// learnerStateFilteringExample();








































