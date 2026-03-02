/**
 * Evidence Index
 * 
 * Fast index for negative evidence aggregation and penalty scoring.
 * 
 * Version: 1.0.0
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { NegativeEvidence } from './types';
import { hashCanonical } from '../../contracts/invariants/CanonicalHashing';
import { Domain } from '../../contracts/enums/Domains';

/**
 * Evidence aggregation key.
 */
export interface EvidenceKey {
  /** Concept ID @ version */
  concept_id_version: string;
  /** Domain */
  domain: Domain;
  /** Key fingerprint (hash of top N reprKeys) */
  key_fingerprint: string;
}

/**
 * Aggregated evidence statistics.
 */
export interface EvidenceStats {
  /** Total failure count */
  fail_count_total: number;
  /** Failure count by code */
  fail_count_by_code: Record<string, number>;
  /** Recent fail streak */
  recent_fail_streak: number;
  /** Last fail timestamp */
  last_fail_ts: string;
}

/**
 * Evidence index entry.
 */
export interface EvidenceIndexEntry {
  /** Evidence key */
  key: EvidenceKey;
  /** Statistics */
  stats: EvidenceStats;
}

/**
 * Evidence index.
 */
export interface EvidenceIndex {
  /** By concept ID @ version */
  by_concept: Record<string, EvidenceStats>;
  /** By fingerprint */
  by_fingerprint: Record<string, EvidenceIndexEntry[]>;
}

/**
 * Computes key fingerprint from reprKeys (top N=3).
 */
export function computeKeyFingerprint(reprKeys: string[]): string {
  const topKeys = reprKeys.slice(0, 3).sort(); // Sort for stability
  return hashCanonical(JSON.stringify(topKeys));
}

/**
 * Aggregates negative evidence into statistics.
 */
export function aggregateEvidence(evidence: NegativeEvidence[]): EvidenceStats {
  const stats: EvidenceStats = {
    fail_count_total: evidence.length,
    fail_count_by_code: {},
    recent_fail_streak: 0,
    last_fail_ts: ''
  };

  // Sort by timestamp (most recent first)
  const sorted = [...evidence].sort((a, b) => 
    b.timestamp_iso.localeCompare(a.timestamp_iso)
  );

  // Count by code
  for (const ev of evidence) {
    stats.fail_count_by_code[ev.why_code] = (stats.fail_count_by_code[ev.why_code] || 0) + 1;
  }

  // Compute recent fail streak (consecutive failures)
  if (sorted.length > 0) {
    stats.last_fail_ts = sorted[0].timestamp_iso;
    let streak = 0;
    for (const ev of sorted) {
      streak++;
      // Break on first non-failure (if we had success tracking)
      // For now, just count recent failures
    }
    stats.recent_fail_streak = Math.min(streak, 10); // Cap at 10
  }

  return stats;
}

/**
 * Builds evidence index from negative evidence records.
 */
export function buildEvidenceIndex(
  evidence: NegativeEvidence[],
  domain: Domain,
  keyFingerprint: string
): EvidenceIndex {
  const index: EvidenceIndex = {
    by_concept: {},
    by_fingerprint: {}
  };

  // Group by concept_id@version
  const byConcept = new Map<string, NegativeEvidence[]>();
  for (const ev of evidence) {
    const key = `${ev.concept_id}@${ev.concept_version}`;
    if (!byConcept.has(key)) {
      byConcept.set(key, []);
    }
    byConcept.get(key)!.push(ev);
  }

  // Aggregate by concept
  for (const [conceptKey, evList] of byConcept.entries()) {
    index.by_concept[conceptKey] = aggregateEvidence(evList);
  }

  // Group by fingerprint
  const byFingerprint = new Map<string, EvidenceIndexEntry[]>();
  for (const [conceptKey, evList] of byConcept.entries()) {
    const stats = aggregateEvidence(evList);
    const entry: EvidenceIndexEntry = {
      key: {
        concept_id_version: conceptKey,
        domain,
        key_fingerprint
      },
      stats
    };

    if (!byFingerprint.has(keyFingerprint)) {
      byFingerprint.set(keyFingerprint, []);
    }
    byFingerprint.get(keyFingerprint)!.push(entry);
  }

  for (const [fp, entries] of byFingerprint.entries()) {
    index.by_fingerprint[fp] = entries;
  }

  return index;
}

/**
 * Loads evidence index from disk.
 */
export async function loadEvidenceIndex(vaultRoot: string): Promise<EvidenceIndex> {
  const indexDir = join(vaultRoot, 'evidence', 'index');
  
  try {
    // Load by_concept index
    const byConceptPath = join(indexDir, 'by_concept');
    const byConcept: Record<string, EvidenceStats> = {};
    
    try {
      const files = await fs.readdir(byConceptPath);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const conceptKey = file.slice(0, -5); // Remove .json
          const content = await fs.readFile(join(byConceptPath, file), 'utf8');
          byConcept[conceptKey] = JSON.parse(content);
        }
      }
    } catch {
      // Directory doesn't exist yet
    }

    // Load by_fingerprint index
    const byFingerprintPath = join(indexDir, 'by_fingerprint');
    const byFingerprint: Record<string, EvidenceIndexEntry[]> = {};
    
    try {
      const files = await fs.readdir(byFingerprintPath);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const fingerprint = file.slice(0, -5); // Remove .json
          const content = await fs.readFile(join(byFingerprintPath, file), 'utf8');
          byFingerprint[fingerprint] = JSON.parse(content);
        }
      }
    } catch {
      // Directory doesn't exist yet
    }

    return { by_concept: byConcept, by_fingerprint: byFingerprint };
  } catch {
    return { by_concept: {}, by_fingerprint: {} };
  }
}

/**
 * Updates evidence index with new negative evidence.
 */
export async function updateEvidenceIndex(
  vaultRoot: string,
  evidence: NegativeEvidence,
  domain: Domain,
  keyFingerprint: string
): Promise<void> {
  const indexDir = join(vaultRoot, 'evidence', 'index');
  const byConceptDir = join(indexDir, 'by_concept');
  const byFingerprintDir = join(indexDir, 'by_fingerprint');

  await fs.mkdir(byConceptDir, { recursive: true });
  await fs.mkdir(byFingerprintDir, { recursive: true });

  const conceptKey = `${evidence.concept_id}@${evidence.concept_version}`;

  // Load existing evidence for this concept
  const existingEvidence = await readNegativeEvidence(vaultRoot, evidence.concept_id);
  const filteredEvidence = existingEvidence.filter(
    ev => ev.concept_version === evidence.concept_version
  );
  filteredEvidence.push(evidence);

  // Aggregate and write by_concept
  const stats = aggregateEvidence(filteredEvidence);
  await fs.writeFile(
    join(byConceptDir, `${conceptKey}.json`),
    JSON.stringify(stats, null, 2),
    'utf8'
  );

  // Update by_fingerprint (load existing, update, write)
  const fingerprintPath = join(byFingerprintDir, `${keyFingerprint}.json`);
  let fingerprintEntries: EvidenceIndexEntry[] = [];
  
  try {
    const content = await fs.readFile(fingerprintPath, 'utf8');
    fingerprintEntries = JSON.parse(content);
  } catch {
    // File doesn't exist yet
  }

  // Update or add entry
  const existingIndex = fingerprintEntries.findIndex(
    e => e.key.concept_id_version === conceptKey
  );
  const entry: EvidenceIndexEntry = {
    key: {
      concept_id_version: conceptKey,
      domain,
      key_fingerprint
    },
    stats
  };

  if (existingIndex >= 0) {
    fingerprintEntries[existingIndex] = entry;
  } else {
    fingerprintEntries.push(entry);
  }

  await fs.writeFile(
    fingerprintPath,
    JSON.stringify(fingerprintEntries, null, 2),
    'utf8'
  );
}

