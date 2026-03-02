/**
 * In-Memory Store Singleton
 * 
 * Ensures API and pages share the same store instance in development.
 * In production, this would be replaced with a proper database.
 * 
 * Version: 0.1
 */

import { InMemoryLearningStore } from "./InMemoryLearningStore";
import { ILearningStore } from "./ILearningStore";

/**
 * Global store instance (singleton pattern).
 * In development, this ensures API routes and pages share the same store.
 */
let storeInstance: ILearningStore | null = null;

/**
 * Gets or creates the singleton store instance.
 */
export function getStore(): ILearningStore {
  if (!storeInstance) {
    storeInstance = new InMemoryLearningStore();
  }
  return storeInstance;
}

/**
 * Resets the store instance (for testing).
 */
export function resetStore(): void {
  storeInstance = null;
}








































