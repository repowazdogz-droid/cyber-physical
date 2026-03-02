/**
 * In-Memory Learning Store
 * 
 * Map-based implementation with strict bounds enforcement.
 * Per Contract 71: bounded storage, no infinite growth.
 * 
 * Version: 0.1
 */

import {
  ILearningStore
} from "./ILearningStore";
import {
  StoredLearnerState,
  StoredSessionRecord
} from "./StoreTypes";
import { KernelRunRecord } from "../../../kernels/surfaces/learning/KernelSurfaceTypes";
import { OrchestratorRunRecord } from "./OrchestratorRunTypes";

/**
 * Maximum number of sessions per learner.
 */
const MAX_SESSIONS_PER_LEARNER = 200;

/**
 * Maximum number of turns per session.
 */
const MAX_TURNS_PER_SESSION = 50;

/**
 * Maximum number of observations per session.
 */
const MAX_OBSERVATIONS_PER_SESSION = 200;

/**
 * Maximum number of kernel runs per learner.
 */
const MAX_KERNEL_RUNS_PER_LEARNER = 50;

/**
 * Maximum number of orchestrator runs per learner.
 */
const MAX_ORCHESTRATOR_RUNS_PER_LEARNER = 20;

/**
 * In-memory learning store implementation.
 * Uses Maps for storage with FIFO eviction when bounds are exceeded.
 */
export class InMemoryLearningStore implements ILearningStore {
  private learnerStates: Map<string, StoredLearnerState> = new Map();
  private sessions: Map<string, StoredSessionRecord> = new Map();
  private learnerSessions: Map<string, string[]> = new Map(); // learnerId -> sessionIds (ordered)
  private kernelRuns: Map<string, KernelRunRecord> = new Map(); // runId -> KernelRunRecord
  private learnerKernelRuns: Map<string, string[]> = new Map(); // learnerId -> runIds (ordered)
  private orchestratorRuns: Map<string, OrchestratorRunRecord> = new Map(); // runId -> OrchestratorRunRecord
  private learnerOrchestratorRuns: Map<string, string[]> = new Map(); // learnerId -> runIds (ordered)
  
  getLearnerState(learnerId: string): StoredLearnerState | undefined {
    return this.learnerStates.get(learnerId);
  }
  
  saveLearnerState(state: StoredLearnerState): void {
    this.learnerStates.set(state.learnerProfile.learnerId, state);
  }
  
  appendSession(record: StoredSessionRecord): void {
    // Enforce bounds on session record
    const boundedRecord: StoredSessionRecord = {
      ...record,
      tutorTurns: record.tutorTurns.slice(-MAX_TURNS_PER_SESSION),
      observations: record.observations.slice(-MAX_OBSERVATIONS_PER_SESSION),
      assessmentOutputs: record.assessmentOutputs?.slice(-10) // Max 10 assessments per session
    };
    
    // Store session
    this.sessions.set(record.sessionId, boundedRecord);
    
    // Update learner sessions index
    const learnerId = record.learnerId;
    let sessionIds = this.learnerSessions.get(learnerId) || [];
    
    // Add new session (at the end, newest first)
    if (!sessionIds.includes(record.sessionId)) {
      sessionIds = [record.sessionId, ...sessionIds];
    }
    
    // Enforce max sessions per learner (FIFO - remove oldest)
    if (sessionIds.length > MAX_SESSIONS_PER_LEARNER) {
      const removedSessions = sessionIds.slice(MAX_SESSIONS_PER_LEARNER);
      removedSessions.forEach(sessionId => {
        this.sessions.delete(sessionId);
      });
      sessionIds = sessionIds.slice(0, MAX_SESSIONS_PER_LEARNER);
    }
    
    this.learnerSessions.set(learnerId, sessionIds);
  }
  
  getSession(sessionId: string): StoredSessionRecord | undefined {
    return this.sessions.get(sessionId);
  }
  
  listSessions(learnerId: string, limit?: number): StoredSessionRecord[] {
    const sessionIds = this.learnerSessions.get(learnerId) || [];
    const limitedIds = limit ? sessionIds.slice(0, limit) : sessionIds;
    
    return limitedIds
      .map(id => this.sessions.get(id))
      .filter((record): record is StoredSessionRecord => record !== undefined);
  }
  
  appendKernelRun(learnerId: string, run: KernelRunRecord): void {
    // Ensure run has learnerId set
    const runWithLearnerId: KernelRunRecord = {
      ...run,
      learnerId: run.learnerId || learnerId
    };
    
    // Store kernel run
    this.kernelRuns.set(runWithLearnerId.runId, runWithLearnerId);

    // Update learner kernel runs index
    let runIds = this.learnerKernelRuns.get(learnerId) || [];

    // Add new run (at the beginning, newest first)
    if (!runIds.includes(run.runId)) {
      runIds = [run.runId, ...runIds];
    }

    // Enforce max kernel runs per learner (FIFO - remove oldest)
    if (runIds.length > MAX_KERNEL_RUNS_PER_LEARNER) {
      const removedRuns = runIds.slice(MAX_KERNEL_RUNS_PER_LEARNER);
      removedRuns.forEach(runId => {
        this.kernelRuns.delete(runId);
      });
      runIds = runIds.slice(0, MAX_KERNEL_RUNS_PER_LEARNER);
    }

    this.learnerKernelRuns.set(learnerId, runIds);

    // Also update learner state if it exists
    const state = this.learnerStates.get(learnerId);
    if (state) {
      state.kernelRuns = runIds
        .map(id => this.kernelRuns.get(id))
        .filter((r): r is KernelRunRecord => r !== undefined && r.learnerId === learnerId)
        .slice(0, MAX_KERNEL_RUNS_PER_LEARNER);
      this.learnerStates.set(learnerId, state);
    }
  }

  listKernelRuns(learnerId: string, limit?: number): KernelRunRecord[] {
    const runIds = this.learnerKernelRuns.get(learnerId) || [];
    const limitedIds = limit ? runIds.slice(0, limit) : runIds;

    return limitedIds
      .map(id => this.kernelRuns.get(id))
      .filter((run): run is KernelRunRecord => run !== undefined);
  }

  getKernelRun(learnerId: string, runId: string): KernelRunRecord | undefined {
    const run = this.kernelRuns.get(runId);
    if (run && run.learnerId === learnerId) {
      return run;
    }
    return undefined;
  }

  appendOrchestratorRun(learnerId: string, run: OrchestratorRunRecord): void {
    // Store orchestrator run
    this.orchestratorRuns.set(run.runId, run);

    // Update learner orchestrator runs index
    let runIds = this.learnerOrchestratorRuns.get(learnerId) || [];

    // Add new run (at the beginning, newest first)
    if (!runIds.includes(run.runId)) {
      runIds = [run.runId, ...runIds];
    }

    // Enforce max orchestrator runs per learner (FIFO - remove oldest)
    if (runIds.length > MAX_ORCHESTRATOR_RUNS_PER_LEARNER) {
      const removedRuns = runIds.slice(MAX_ORCHESTRATOR_RUNS_PER_LEARNER);
      removedRuns.forEach(runId => {
        this.orchestratorRuns.delete(runId);
      });
      runIds = runIds.slice(0, MAX_ORCHESTRATOR_RUNS_PER_LEARNER);
    }

    this.learnerOrchestratorRuns.set(learnerId, runIds);

    // Also update learner state if it exists
    const state = this.learnerStates.get(learnerId);
    if (state) {
      state.orchestratorRuns = runIds
        .map(id => this.orchestratorRuns.get(id))
        .filter((r): r is OrchestratorRunRecord => r !== undefined)
        .slice(0, MAX_ORCHESTRATOR_RUNS_PER_LEARNER);
      this.learnerStates.set(learnerId, state);
    }
  }

  listOrchestratorRuns(learnerId: string, limit?: number): OrchestratorRunRecord[] {
    const runIds = this.learnerOrchestratorRuns.get(learnerId) || [];
    const limitedIds = limit ? runIds.slice(0, limit) : runIds;

    return limitedIds
      .map(id => this.orchestratorRuns.get(id))
      .filter((run): run is OrchestratorRunRecord => run !== undefined);
  }

  getOrchestratorRun(learnerId: string, runId: string): OrchestratorRunRecord | undefined {
    const run = this.orchestratorRuns.get(runId);
    // Note: OrchestratorRunRecord doesn't have learnerId, so we check via index
    const runIds = this.learnerOrchestratorRuns.get(learnerId) || [];
    if (run && runIds.includes(runId)) {
      return run;
    }
    return undefined;
  }

  /**
   * Clear all data (for testing).
   */
  clear(): void {
    this.learnerStates.clear();
    this.sessions.clear();
    this.learnerSessions.clear();
    this.kernelRuns.clear();
    this.learnerKernelRuns.clear();
    this.orchestratorRuns.clear();
    this.learnerOrchestratorRuns.clear();
  }
}

