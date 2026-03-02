/**
 * Visibility Filters
 * 
 * Implements privacy/visibility filtering per Contract 71.
 * Minors: Parent/Teacher can see by default.
 * Adults: Private by default; Teacher visibility only if opted-in.
 * 
 * Version: 0.1
 */

import {
  ViewerRole as StoreViewerRole,
  VisibilityPolicy,
  StoredSessionRecord,
  FilteredSessionRecord,
  StoredLearnerState,
  FilteredLearnerState
} from "./StoreTypes";
import { LearnerProfile, AgeBand } from "../LearnerTypes";
import { KernelRunRecord } from "../../../kernels/surfaces/learning/KernelSurfaceTypes";
import { OrchestratorRunRecord } from "./OrchestratorRunTypes";
import { evaluateGate } from "@spine/gates/GateEngine";
import { GateAction, ViewerRole, Surface, ConsentState } from "@spine/gates/GateTypes";

/**
 * Gets visibility policy for a learner profile.
 * Per Contract 71: age-appropriate visibility rules.
 */
export function getVisibilityPolicy(
  profile: LearnerProfile,
  optInTeacherAccess?: boolean
): VisibilityPolicy {
  const isMinor = profile.safety.minor;
  
  return {
    learnerId: profile.learnerId,
    isMinor,
    parentCanView: isMinor, // Parents can view minors by default
    teacherCanView: isMinor || (optInTeacherAccess === true), // Teachers can view minors, or adults if opted-in
    institutionCanView: profile.safety.institutionMode, // Institution mode enables institution access
    learnerCanView: true, // Learners can always view their own data
    hideInternalMechanics: true // Always hide internal guardrail/refusal mechanics
  };
}

/**
 * Filters session record for a viewer role.
 * Per Contract 71: applies age-appropriate visibility rules.
 */
export function filterSessionForViewer(
  record: StoredSessionRecord,
  role: StoreViewerRole,
  policy: VisibilityPolicy
): FilteredSessionRecord {
  // Check if viewer has access
  let hasAccess = false;
  
  switch (role) {
    case "Learner":
      hasAccess = policy.learnerCanView && record.learnerId === policy.learnerId;
      break;
    case "Parent":
      hasAccess = policy.parentCanView;
      break;
    case "Teacher":
      hasAccess = policy.teacherCanView;
      break;
    case "Institution":
      hasAccess = policy.institutionCanView;
      break;
  }
  
  if (!hasAccess) {
    // Return minimal record with visibility note
    return {
      sessionId: record.sessionId,
      learnerId: record.learnerId,
      goal: record.goal,
      tutorTurns: [],
      observations: [],
      sessionTrace: {
        timestampIso: record.sessionTrace.timestampIso,
        inputsHash: "",
        contractsVersion: record.sessionTrace.contractsVersion,
        sessionId: record.sessionId,
        learnerId: record.learnerId,
        refusals: [],
        notes: [],
        turnCount: 0,
        assessmentGenerated: false,
        skillUpdatesCount: 0
      },
      createdAtIso: record.createdAtIso,
      visibilityNote: "Access denied for this role"
    };
  }
  
  // Filter based on role and policy
  const filtered: FilteredSessionRecord = {
    sessionId: record.sessionId,
    learnerId: record.learnerId,
    goal: record.goal,
    tutorTurns: [...record.tutorTurns],
    observations: [...record.observations],
    assessmentOutputs: record.assessmentOutputs ? [...record.assessmentOutputs] : undefined,
    sessionTrace: { ...record.sessionTrace },
    createdAtIso: record.createdAtIso,
    // Include sessionSummary and selfChecks (allowed for teachers/parents)
    sessionSummary: record.sessionSummary,
    selfChecks: record.selfChecks
  };
  
  // Hide internal mechanics if policy requires it
  if (policy.hideInternalMechanics) {
    // Remove internal refusal reasons that reveal system internals
    if (filtered.sessionTrace.refusals) {
      filtered.sessionTrace.refusals = filtered.sessionTrace.refusals.filter(
        refusal => !refusal.includes("internal") && !refusal.includes("system")
      );
    }
    
    // Remove internal notes that reveal system internals
    if (filtered.sessionTrace.notes) {
      filtered.sessionTrace.notes = filtered.sessionTrace.notes.filter(
        note => !note.includes("internal") && !note.includes("system")
      );
    }
  }
  
  // For adults viewed by teachers (if opted-in), may want to redact more
  if (role === "Teacher" && !policy.isMinor) {
    // Teachers viewing adults get full access if opted-in, but we could add more filtering here
    // For now, if teacherCanView is true, they get full access
  }
  
  return filtered;
}

/**
 * Filters learner state for a viewer role.
 * Per Contract 71: applies age-appropriate visibility rules.
 */
export function filterLearnerStateForViewer(
  state: StoredLearnerState,
  role: StoreViewerRole,
  policy: VisibilityPolicy
): FilteredLearnerState {
  // Check if viewer has access
  let hasAccess = false;
  
  switch (role) {
    case "Learner":
      hasAccess = policy.learnerCanView && state.learnerProfile.learnerId === policy.learnerId;
      break;
    case "Parent":
      hasAccess = policy.parentCanView;
      break;
    case "Teacher":
      hasAccess = policy.teacherCanView;
      break;
    case "Institution":
      hasAccess = policy.institutionCanView;
      break;
  }
  
  if (!hasAccess) {
    // Return minimal state with visibility note
    return {
      learnerProfile: {
        learnerId: state.learnerProfile.learnerId,
        ageBand: state.learnerProfile.ageBand
      },
      skillGraph: {},
      version: state.version,
      visibilityNote: "Access denied for this role"
    };
  }
  
  // Filter based on role
  const filtered: FilteredLearnerState = {
    learnerProfile: { ...state.learnerProfile },
    skillGraph: {
      learnerId: state.skillGraph.learnerId,
      skills: new Map(state.skillGraph.skills),
      lastUpdated: state.skillGraph.lastUpdated,
      version: state.skillGraph.version
    },
    lastSessionId: state.lastSessionId,
    version: state.version
  };
  
  // Include pause state and nudges based on visibility policy
  // Minors: visible to teacher/parent by default
  // Adults: visible only if opted-in
  if (policy.isMinor || (role === "Teacher" && !policy.isMinor && policy.teacherCanView)) {
    filtered.pausedByTeacher = state.pausedByTeacher;
    filtered.teacherNudges = state.teacherNudges ? [...state.teacherNudges] : undefined;
    filtered.linkedTeacherId = state.linkedTeacherId;
  }
  
        // Include kernelRuns if gate allows
        if (state.kernelRuns) {
          const gateDecision = evaluateGate(GateAction.VIEW_KERNEL_RUNS, {
            viewerRole: role === 'Teacher' ? ViewerRole.Teacher : ViewerRole.Learner,
            isMinor: policy.isMinor,
            consentState: policy.teacherCanView ? ConsentState.OptedIn : ConsentState.NotOptedIn,
            surface: Surface.TeacherRecap
          });

          if (gateDecision.allowed) {
    // Apply constraints from gate
    const maxTraceNodes = gateDecision.constraints?.maxTraceNodes ?? 20;
    const redactFields = gateDecision.constraints?.redactFields || [];
    
    // Filter out internal/system markers from trace nodes
    const filteredKernelRuns = state.kernelRuns.map(run => {
      // Filter claims (strip internal/system)
      const filteredClaims = run.claims
        .filter(claim => {
          const text = claim.text.toLowerCase();
          return !text.includes('internal') && !text.includes('system');
        })
        .map(claim => ({
          ...claim,
          text: claim.text.replace(/internal|system/gi, '').trim()
        }));

      // Filter trace nodes (strip internal/system, apply maxTraceNodes)
      const filteredTrace = run.trace
        .slice(0, maxTraceNodes) // Apply maxTraceNodes constraint
        .filter(node => {
          const label = node.label.toLowerCase();
          const desc = node.description.toLowerCase();
          const shouldFilter = redactFields.some((field: string) => 
            label.includes(field.toLowerCase()) || desc.includes(field.toLowerCase())
          );
          return !shouldFilter;
        })
        .map(node => {
          // Remove redactFields from labels and descriptions
          let label = node.label;
          let description = node.description;
          for (const field of redactFields) {
            label = label.replace(new RegExp(field, 'gi'), '').trim();
            description = description.replace(new RegExp(field, 'gi'), '').trim();
          }
          return {
            ...node,
            label: label || node.label,
            description: description || node.description
          };
        });

      return {
        ...run,
        claims: filteredClaims,
        trace: filteredTrace
      };
    });
    filtered.kernelRuns = filteredKernelRuns;
    }
  }

  // Include orchestratorRuns if gate allows
  if (state.orchestratorRuns) {
    const gateDecision = evaluateGate(GateAction.VIEW_ORCHESTRATOR_RUNS, {
      viewerRole: role === 'Teacher' ? ViewerRole.Teacher : role === 'Parent' ? ViewerRole.Parent : ViewerRole.Learner,
      isMinor: policy.isMinor,
      consentState: policy.teacherCanView ? ConsentState.OptedIn : ConsentState.NotOptedIn,
      surface: Surface.TeacherRecap
    });

    if (gateDecision.allowed) {
      // Apply constraints from gate
      const maxItems = gateDecision.constraints?.maxItems;
      const redactFields = gateDecision.constraints?.redactFields || [];
    // Filter out internal/system markers from trace highlights
    const filteredOrchestratorRuns = state.orchestratorRuns
      .slice(0, maxItems) // Apply maxItems constraint
      .map(run => {
      // Filter trace highlights (strip redactFields)
      const filteredHighlights = run.traceHighlights
        .filter(highlight => {
          const label = highlight.label.toLowerCase();
          const desc = highlight.description.toLowerCase();
          const shouldFilter = redactFields.some(field => 
            label.includes(field.toLowerCase()) || desc.includes(field.toLowerCase())
          );
          return !shouldFilter;
        })
        .map(highlight => {
          let label = highlight.label;
          let description = highlight.description;
          for (const field of redactFields) {
            label = label.replace(new RegExp(field, 'gi'), '').trim();
            description = description.replace(new RegExp(field, 'gi'), '').trim();
          }
          return {
            ...highlight,
            label: label || highlight.label,
            description: description || highlight.description
          };
        });

      // Filter summary claims (strip internal/system)
      const filteredClaims = run.summaryClaims
        .filter(claim => {
          const title = claim.title.toLowerCase();
          return !title.includes('internal') && !title.includes('system');
        })
        .map(claim => ({
          ...claim,
          title: claim.title.replace(/internal|system/gi, '').trim() || claim.title
        }));

      return {
        ...run,
        traceHighlights: filteredHighlights,
        summaryClaims: filteredClaims
      };
    });
    filtered.orchestratorRuns = filteredOrchestratorRuns;
    }
  }
  
  // For adults viewed by teachers, may want to redact skill graph details
  if (role === "Teacher" && !policy.isMinor) {
    // If teacher access is opted-in, they get full access
    // Could add more filtering here if needed
  }
  
  return filtered;
}

