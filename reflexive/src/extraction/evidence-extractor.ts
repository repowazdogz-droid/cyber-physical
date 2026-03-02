/**
 * Extract EvidenceItems from claims' evidence_basis during parsing.
 * 
 * Creates evidence items and links automatically from evidence_basis strings,
 * eliminating the need for stimulus-as-evidence hacks.
 * 
 * De-duplicates evidence items by (type + content hash) to avoid creating duplicates.
 */

import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import type { ExtractedClaim } from './types.js';

export interface ExtractedEvidenceItem {
  id: string;
  content_text: string;
  source_type: 'stimulus_quote' | 'context_excerpt' | 'lens_inference'; // Application-level type
  source: string; // lens name or lens_raw_ref
  as_of: string;
  created_at: string;
}

/**
 * Map application-level source_type to database enum.
 * Database enum: 'document', 'measurement', 'citation', 'testimony', 'observation'
 */
function mapSourceTypeToDb(appType: 'stimulus_quote' | 'context_excerpt' | 'lens_inference'): 'document' | 'measurement' | 'citation' | 'testimony' | 'observation' {
  switch (appType) {
    case 'stimulus_quote':
    case 'context_excerpt':
      return 'document'; // Both are document-like sources
    case 'lens_inference':
      return 'observation'; // Lens's own observation/reasoning
    default:
      return 'observation'; // Safe default
  }
}

export interface ExtractedEvidenceLink {
  claim_id: string;
  evidence_item_id: string;
  support_type: 'supports'; // Always 'supports' for evidence_basis-derived links
}

/**
 * Compute content hash for de-duplication.
 */
function computeContentHash(content: string, sourceType: string): string {
  const normalized = content.toLowerCase().trim();
  const combined = `${sourceType}:${normalized}`;
  return createHash('sha256').update(combined).digest('hex').substring(0, 16);
}

/**
 * Classify evidence type from evidence_basis content.
 * - "stimulus_quote" if contains "stimulus" or repeats stimulus facts
 * - else "lens_inference" (or "context_excerpt" if it seems like external context)
 */
function classifyEvidenceType(evidenceBasis: string, stimulusText?: string): 'stimulus_quote' | 'context_excerpt' | 'lens_inference' {
  const basisLower = evidenceBasis.toLowerCase();
  
  // Check if it explicitly mentions stimulus
  if (basisLower.includes('stimulus') || basisLower.includes('prompt') || basisLower.includes('input')) {
    return 'stimulus_quote';
  }
  
  // Check if it repeats stimulus facts (simple heuristic: check for numbers/dates from stimulus)
  if (stimulusText) {
    const stimulusLower = stimulusText.toLowerCase();
    // Extract numbers and key phrases from stimulus
    const stimulusNumbers = stimulusText.match(/\$?\d+[BMK]?/g) || [];
    const stimulusEntities = stimulusText.match(/\b[A-Z][a-z]+\b/g) || [];
    
    // If evidence_basis contains stimulus numbers or entities, likely stimulus_quote
    const hasStimulusNumbers = stimulusNumbers.some(num => basisLower.includes(num.toLowerCase()));
    const hasStimulusEntities = stimulusEntities.slice(0, 3).some(entity => basisLower.includes(entity.toLowerCase()));
    
    if (hasStimulusNumbers || hasStimulusEntities) {
      return 'stimulus_quote';
    }
  }
  
  // Default: lens_inference (lens's own reasoning/context)
  // Note: We could distinguish "context_excerpt" if evidence_basis looks like external citation,
  // but for now, treat all non-stimulus as lens_inference
  return 'lens_inference';
}

/**
 * Extract evidence items and links from claims' evidence_basis.
 * 
 * De-duplicates by (type + content hash) to avoid creating 30 duplicates.
 * 
 * @param claims Claims with evidence_basis fields
 * @param analysisStartedAt Timestamp for evidence items
 * @param lensNameMap Map of perspective_id -> lens_name (for source attribution)
 * @param stimulusText Optional stimulus text for classification
 */
export function extractEvidenceFromClaims(
  claims: ExtractedClaim[],
  analysisStartedAt: string,
  lensNameMap: Map<string, string>,
  stimulusText?: string
): {
  evidenceItems: ExtractedEvidenceItem[];
  evidenceLinks: ExtractedEvidenceLink[];
} {
  const evidenceItems: ExtractedEvidenceItem[] = [];
  const evidenceLinks: ExtractedEvidenceLink[] = [];
  
  // De-duplication map: (type + content hash) -> evidence_item_id
  const dedupeMap = new Map<string, string>();
  
  for (const claim of claims) {
    // Skip if no evidence_basis
    if (!claim.evidence_basis || claim.evidence_basis.trim().length === 0) {
      continue;
    }
    
    // Classify evidence type
    const sourceType = classifyEvidenceType(claim.evidence_basis, stimulusText);
    
    // Compute content hash for de-duplication
    const contentHash = computeContentHash(claim.evidence_basis, sourceType);
    const dedupeKey = `${sourceType}:${contentHash}`;
    
    // Get or create evidence item
    let evidenceItemId: string;
    if (dedupeMap.has(dedupeKey)) {
      // Reuse existing evidence item
      evidenceItemId = dedupeMap.get(dedupeKey)!;
    } else {
      // Create new evidence item
      evidenceItemId = uuidv4();
      const lensName = lensNameMap.get(claim.perspective_id) || 'unknown';
      
      evidenceItems.push({
        id: evidenceItemId,
        content_text: claim.evidence_basis.trim(),
        source_type: sourceType, // Application-level type (will be mapped to DB enum in queries.ts)
        source: lensName, // Use lens name as source
        as_of: analysisStartedAt,
        created_at: analysisStartedAt,
      });
      
      dedupeMap.set(dedupeKey, evidenceItemId);
    }
    
    // Create evidence link
    evidenceLinks.push({
      claim_id: claim.id,
      evidence_item_id: evidenceItemId,
      support_type: 'supports',
    });
  }
  
  return {
    evidenceItems,
    evidenceLinks,
  };
}
