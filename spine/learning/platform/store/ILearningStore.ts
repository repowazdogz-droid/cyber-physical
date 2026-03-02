/**
 * Learning Store Interface
 * 
 * Defines the interface for learning data storage.
 * Simple, deterministic, bounded.
 * 
 * Version: 0.1
 */

import {
  StoredLearnerState,
  StoredSessionRecord
} from "./StoreTypes";
import { KernelRunRecord } from "../../../kernels/surfaces/learning/KernelSurfaceTypes";
import { OrchestratorRunRecord } from "./OrchestratorRunTypes";

/**
 * Learning store interface.
 * Provides methods for storing and retrieving learner data.
 */
export interface ILearningStore {
  /**
   * Get learner state by learner ID.
   * Returns undefined if not found.
   */
  getLearnerState(learnerId: string): StoredLearnerState | undefined;
  
  /**
   * Save learner state.
   * Replaces existing state for the learner.
   */
  saveLearnerState(state: StoredLearnerState): void;
  
  /**
   * Append a session record.
   * Enforces bounds (max sessions per learner, max turns per session, etc.).
   */
  appendSession(record: StoredSessionRecord): void;
  
  /**
   * Get a session by session ID.
   * Returns undefined if not found.
   */
  getSession(sessionId: string): StoredSessionRecord | undefined;
  
  /**
   * List sessions for a learner.
   * Returns sessions ordered by creation time (newest first).
   * Limited by the limit parameter.
   */
  listSessions(learnerId: string, limit?: number): StoredSessionRecord[];

  /**
   * Appends a kernel run record (bounded, FIFO eviction at 50).
   */
  appendKernelRun(learnerId: string, run: KernelRunRecord): void;

  /**
   * Lists kernel runs for a learner (bounded, FIFO order).
   */
  listKernelRuns(learnerId: string, limit?: number): KernelRunRecord[];

  /**
   * Gets a specific kernel run by ID.
   */
  getKernelRun(learnerId: string, runId: string): KernelRunRecord | undefined;

  /**
   * Appends an orchestrator run record (bounded, FIFO eviction at 20).
   */
  appendOrchestratorRun(learnerId: string, run: OrchestratorRunRecord): void;

  /**
   * Lists orchestrator runs for a learner (bounded, FIFO order).
   */
  listOrchestratorRuns(learnerId: string, limit?: number): OrchestratorRunRecord[];

  /**
   * Gets a specific orchestrator run by ID.
   */
  getOrchestratorRun(learnerId: string, runId: string): OrchestratorRunRecord | undefined;
}

