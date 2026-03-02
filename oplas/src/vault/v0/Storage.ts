/**
 * Storage
 * 
 * Stores and retrieves concept cards from vault.
 * 
 * Version: 1.0.0
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { ConceptCard } from '../../contracts/types/ConceptCard';
import { NegativeEvidence } from './types';
import { AuditCommit } from './types';

/**
 * Reads a concept card from vault.
 */
export async function readConcept(
  vaultRoot: string,
  conceptId: string,
  version: string
): Promise<ConceptCard | null> {
  const conceptPath = join(vaultRoot, 'concepts', conceptId, `${version}.yaml`);
  
  try {
    const content = await fs.readFile(conceptPath, 'utf8');
    // Simple YAML parsing (v0: use JSON-like structure)
    // For now, assume YAML is JSON-compatible or use a simple parser
    const concept = JSON.parse(content); // TODO: Use proper YAML parser
    return concept as ConceptCard;
  } catch (error) {
    return null;
  }
}

/**
 * Writes a concept card to vault.
 */
export async function writeConcept(
  vaultRoot: string,
  concept: ConceptCard
): Promise<void> {
  const conceptDir = join(vaultRoot, 'concepts', concept.id);
  await fs.mkdir(conceptDir, { recursive: true });

  const conceptPath = join(conceptDir, `${concept.version}.yaml`);
  
  // Write as JSON for now (v0: can switch to YAML later)
  await fs.writeFile(
    conceptPath,
    JSON.stringify(concept, null, 2),
    'utf8'
  );
}

/**
 * Writes negative evidence to vault.
 */
export async function writeNegativeEvidence(
  vaultRoot: string,
  evidence: NegativeEvidence
): Promise<void> {
  const evidenceDir = join(vaultRoot, 'evidence', 'negative', evidence.concept_id);
  await fs.mkdir(evidenceDir, { recursive: true });

  const timestamp = evidence.timestamp_iso.replace(/[:.]/g, '-');
  const evidencePath = join(evidenceDir, `${timestamp}_${evidence.repr_id}.json`);
  
  await fs.writeFile(
    evidencePath,
    JSON.stringify(evidence, null, 2),
    'utf8'
  );
}

/**
 * Reads negative evidence for a concept.
 */
export async function readNegativeEvidence(
  vaultRoot: string,
  conceptId: string
): Promise<NegativeEvidence[]> {
  const evidenceDir = join(vaultRoot, 'evidence', 'negative', conceptId);
  
  try {
    const files = await fs.readdir(evidenceDir);
    const evidence: NegativeEvidence[] = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(join(evidenceDir, file), 'utf8');
        evidence.push(JSON.parse(content));
      }
    }
    
    return evidence;
  } catch (error) {
    return [];
  }
}

/**
 * Appends audit commit to audit log.
 */
export async function appendAuditCommit(
  vaultRoot: string,
  commit: AuditCommit
): Promise<void> {
  const auditPath = join(vaultRoot, 'audit', 'commits.jsonl');
  
  // Append to JSONL file
  const line = JSON.stringify(commit);
  await fs.appendFile(auditPath, line + '\n', 'utf8');
}

/**
 * Reads audit log.
 */
export async function readAuditLog(vaultRoot: string): Promise<AuditCommit[]> {
  const auditPath = join(vaultRoot, 'audit', 'commits.jsonl');
  
  try {
    const content = await fs.readFile(auditPath, 'utf8');
    return content
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => JSON.parse(line));
  } catch (error) {
    return [];
  }
}

/**
 * Reads all concept cards from vault.
 */
export async function readAllConcepts(vaultRoot: string): Promise<ConceptCard[]> {
  const conceptsDir = join(vaultRoot, 'concepts');
  const concepts: ConceptCard[] = [];

  try {
    const conceptIds = await fs.readdir(conceptsDir);
    
    for (const conceptId of conceptIds) {
      const conceptDir = join(conceptsDir, conceptId);
      const stats = await fs.stat(conceptDir);
      
      if (stats.isDirectory()) {
        const versionFiles = await fs.readdir(conceptDir);
        
        for (const versionFile of versionFiles) {
          if (versionFile.endsWith('.yaml') || versionFile.endsWith('.json')) {
            const version = versionFile.replace(/\.(yaml|json)$/, '');
            const concept = await readConcept(vaultRoot, conceptId, version);
            if (concept) {
              concepts.push(concept);
            }
          }
        }
      }
    }
  } catch (error) {
    // Return empty array if concepts directory doesn't exist
  }

  return concepts;
}

