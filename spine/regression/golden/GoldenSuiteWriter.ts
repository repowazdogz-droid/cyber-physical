/**
 * Golden Suite Writer
 * 
 * Safe bounded writer that updates golden suite.
 * Deterministic ordering, no duplicates.
 * 
 * Version: 1.0.0
 */

import { GoldenCase } from '../RegressionTypes';
import { GOLDEN_SUITE } from './GOLDEN_SUITE';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

/**
 * Golden suite file path (JSON companion file for runtime updates).
 * Can be overridden for testing.
 */
let GOLDEN_SUITE_JSON_PATH = join(process.cwd(), 'spine', 'regression', 'golden', 'GOLDEN_SUITE.json');

/**
 * Sets the golden suite file path (for testing).
 */
export function setGoldenSuitePath(path: string): void {
  GOLDEN_SUITE_JSON_PATH = path;
}

/**
 * Gets the current golden suite file path.
 */
export function getGoldenSuitePath(): string {
  return GOLDEN_SUITE_JSON_PATH;
}

/**
 * Reads golden suite from JSON file (if exists) or falls back to TS constant.
 */
export async function readGoldenSuite(): Promise<GoldenCase[]> {
  try {
    const content = await readFile(GOLDEN_SUITE_JSON_PATH, 'utf-8');
    const parsed = JSON.parse(content);
    if (parsed.cases && Array.isArray(parsed.cases)) {
      return parsed.cases;
    }
  } catch {
    // File doesn't exist or invalid, fall through to TS constant
  }
  
  // Fallback to TS constant
  return GOLDEN_SUITE.filter(c => !c.skip);
}

/**
 * Writes golden suite to JSON file.
 * Ensures deterministic ordering and no duplicates.
 */
export async function writeGoldenSuite(cases: GoldenCase[]): Promise<void> {
  // Remove duplicates by artifactId
  const seen = new Set<string>();
  const uniqueCases: GoldenCase[] = [];

  for (const case_ of cases) {
    if (!seen.has(case_.artifactId)) {
      seen.add(case_.artifactId);
      uniqueCases.push(case_);
    }
  }

  // Sort by label for deterministic ordering
  uniqueCases.sort((a, b) => a.label.localeCompare(b.label));

  // Bound to max 50 cases
  const boundedCases = uniqueCases.slice(0, 50);

  // Write to JSON file
  const content = JSON.stringify({ cases: boundedCases }, null, 2);
  await writeFile(getGoldenSuitePath(), content, 'utf-8');
}

/**
 * Adds a case to the golden suite.
 */
export async function addGoldenCase(case_: GoldenCase): Promise<{ ok: boolean; message: string }> {
  try {
    const existing = await readGoldenSuite();

    // Check if already exists
    if (existing.some(c => c.artifactId === case_.artifactId)) {
      return {
        ok: false,
        message: `Case with artifactId ${case_.artifactId} already exists`
      };
    }

    // Add new case
    const updated = [...existing, case_];
    await writeGoldenSuite(updated);

    return {
      ok: true,
      message: `Added golden case: ${case_.label}`
    };
  } catch (error: any) {
    return {
      ok: false,
      message: error.message || 'Failed to add golden case'
    };
  }
}

/**
 * Removes a case from the golden suite.
 */
export async function removeGoldenCase(artifactId: string): Promise<{ ok: boolean; message: string }> {
  try {
    const existing = await readGoldenSuite();
    const updated = existing.filter(c => c.artifactId !== artifactId);

    if (updated.length === existing.length) {
      return {
        ok: false,
        message: `Case with artifactId ${artifactId} not found`
      };
    }

    await writeGoldenSuite(updated);

    return {
      ok: true,
      message: `Removed golden case: ${artifactId}`
    };
  } catch (error: any) {
    return {
      ok: false,
      message: error.message || 'Failed to remove golden case'
    };
  }
}

/**
 * Gets the current golden suite (reads from JSON if exists, else TS constant).
 */
export async function getGoldenSuite(): Promise<GoldenCase[]> {
  return readGoldenSuite();
}

