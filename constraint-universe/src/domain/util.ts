export function uid(prefix = "c"): string {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

























