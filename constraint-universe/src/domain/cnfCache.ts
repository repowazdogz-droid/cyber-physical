import type { Universe } from "./types";
import type { CnfCompilation } from "./cnf";
import { compileUniverseToCnf } from "./cnf";

type CacheEntry = { key: string; comp: CnfCompilation; at: number };

const CNF_CACHE = new Map<string, CacheEntry>();
const CNF_CACHE_MAX = 8;

function stableKey(u: Universe): string {
  // Small, deterministic key. Order matters, so sort by id to be safe.
  const cs = [...u.constraints].slice().sort((a, b) => (a.id < b.id ? -1 : 1));
  return JSON.stringify({
    states: u.states,
    horizon: u.horizon ?? 0,
    constraints: cs,
  });
}

export function getOrCompileCnf(u: Universe): { key: string; comp: CnfCompilation } {
  const key = stableKey(u);
  const hit = CNF_CACHE.get(key);
  if (hit) {
    hit.at = Date.now();
    return { key, comp: hit.comp };
  }

  const comp = compileUniverseToCnf(u);
  CNF_CACHE.set(key, { key, comp, at: Date.now() });

  // Simple LRU eviction
  if (CNF_CACHE.size > CNF_CACHE_MAX) {
    let oldestKey: string | null = null;
    let oldestAt = Infinity;
    for (const [k, v] of CNF_CACHE.entries()) {
      if (v.at < oldestAt) { oldestAt = v.at; oldestKey = k; }
    }
    if (oldestKey) CNF_CACHE.delete(oldestKey);
  }

  return { key, comp };
}

export function clearCnfCache() {
  CNF_CACHE.clear();
}

























