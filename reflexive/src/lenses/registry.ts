import { getLenses, LensConfig } from '../db/queries.js';

let _cache: LensConfig[] | null = null;

export async function loadActiveLenses(): Promise<LensConfig[]> {
  if (_cache !== null) {
    return _cache;
  }

  const lenses = await getLenses(true);

  if (lenses.length !== 5) {
    throw new Error(`Expected 5 active lenses, got ${lenses.length}`);
  }

  _cache = lenses;
  return lenses;
}

export function clearLensCache(): void {
  _cache = null;
}
