/**
 * Deterministic JSON encoding.
 * Same input ALWAYS produces same string.
 * Keys sorted alphabetically at every depth.
 * No whitespace. Undefined values omitted.
 *
 * This is the foundation of tamper evidence.
 */

export function canonicalise(obj: unknown): string {
  if (obj === null) return 'null';
  if (typeof obj === 'boolean') return obj ? 'true' : 'false';
  if (typeof obj === 'number') {
    if (!Number.isFinite(obj)) return 'null';
    return Object.is(obj, -0) ? '0' : String(obj);
  }
  if (typeof obj === 'string') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(canonicalise).join(',') + ']';
  if (typeof obj === 'object') {
    const sorted = Object.keys(obj as Record<string, unknown>)
      .filter((k) => (obj as Record<string, unknown>)[k] !== undefined)
      .sort();
    return (
      '{' +
      sorted
        .map(
          (k) =>
            JSON.stringify(k) + ':' + canonicalise((obj as Record<string, unknown>)[k])
        )
        .join(',') +
      '}'
    );
  }
  throw new Error(`Cannot canonicalise type: ${typeof obj}`);
}
