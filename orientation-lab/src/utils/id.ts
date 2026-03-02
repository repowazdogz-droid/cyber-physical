export function createId(prefix: string = "id"): string {
  // Simple, stable-enough local ID for prototypes.
  // (We can upgrade later to crypto/randomUUID where available.)
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

