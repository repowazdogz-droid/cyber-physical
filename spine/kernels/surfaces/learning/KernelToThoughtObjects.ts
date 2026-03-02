/**
 * KernelToThoughtObjects: Converts kernel decisions to ThoughtObjects.
 * ND-calm, bounded, deterministic.
 * Uses Claims Registry and Evidence Normalizer for consistent display.
 */

import { KernelDecision, DecisionTrace, Claim } from '../../core/KernelTypes';
import { hashString } from '../../../learning/platform/session/hash';
import { getClaimDescriptor } from '../../../claims/ClaimRegistry';
import { normalizeEvidenceForDisplay } from '../../../claims/EvidenceNormalizer';

// ThoughtObject types (copied to avoid circular dependency)
type ThoughtObjectType = 
  | "LearnerAttempt"
  | "TutorHint"
  | "Example"
  | "Question"
  | "Evidence"
  | "Uncertainty"
  | "Reflection";

type ThoughtObjectSource = "learner" | "tutor" | "system";

type ConfidenceLevel = "low" | "medium" | "high" | "unknown";

interface StructuredContent {
  title?: string;
  body: string;
  items?: string[];
}

export interface ThoughtObject {
  id: string;
  type: ThoughtObjectType;
  content: string | StructuredContent;
  source: ThoughtObjectSource;
  timestamp: string;
  confidence?: ConfidenceLevel;
  relatedStepId?: string;
  ephemeral?: boolean;
}

const MAX_THOUGHT_OBJECTS = 5;

/**
 * Converts KernelDecision + DecisionTrace to ThoughtObjects.
 * Deterministic ordering, bounded output (max 5 objects).
 */
export function kernelToThoughtObjects(
  decision: KernelDecision,
  trace: DecisionTrace,
  claims: Claim[],
  kernelId: string,
  adapterId: string
): ThoughtObject[] {
  const objects: ThoughtObject[] = [];
  const baseId = hashString(`${kernelId}-${adapterId}-${trace.traceId}`);

  // 1. Decision outcome => Reflection
  objects.push({
    id: `${baseId}_decision`,
    type: 'Reflection' as ThoughtObjectType,
    content: {
      title: `Decision: ${decision.outcome}`,
      body: decision.rationale.length > 200 
        ? decision.rationale.substring(0, 197) + '...' 
        : decision.rationale
    },
    source: 'system' as ThoughtObjectSource,
    timestamp: new Date().toISOString(),
    confidence: decision.confidence.toLowerCase() as 'low' | 'medium' | 'high'
  });

  // 2. Top 3 claims => Evidence (bounded to 3)
  // Use Claims Registry for titles/descriptions, normalize evidence
  const topClaims = claims.slice(0, 3);
  for (let i = 0; i < topClaims.length && objects.length < MAX_THOUGHT_OBJECTS; i++) {
    const claim = topClaims[i];
    
    // Try to get claim descriptor from registry (by matching statement or type)
    let claimTitle = claim.statement;
    let claimDescription = '';
    
    // Look up by type (simplified - in real implementation, would match by claimId)
    try {
      const { listClaims } = require('../../../claims/ClaimRegistry');
      const claimDescriptors = listClaims();
      const matchingDescriptor = claimDescriptors.find((desc: any) => 
        desc.type === claim.type || desc.title.toLowerCase().includes(claim.statement.toLowerCase().substring(0, 20))
      );
      
      if (matchingDescriptor) {
        claimTitle = matchingDescriptor.title;
        claimDescription = matchingDescriptor.description;
      }
    } catch (e) {
      // Fallback to original statement if registry not available
    }
    
    // Normalize evidence
    const normalizedEvidence = normalizeEvidenceForDisplay(claim.evidence || []);
    const evidenceText = normalizedEvidence.items.length > 0
      ? normalizedEvidence.items.map(item => item.description || item.reference).join('; ')
      : '';
    
    // Build content (bounded)
    const contentText = claimDescription || claim.statement;
    const fullText = evidenceText 
      ? `${claimTitle}: ${contentText} (${evidenceText})`
      : `${claimTitle}: ${contentText}`;
    
    objects.push({
      id: `${baseId}_claim_${i}`,
      type: 'Evidence' as ThoughtObjectType,
      content: fullText.length > 150 
        ? fullText.substring(0, 147) + '...' 
        : fullText,
      source: 'system' as ThoughtObjectSource,
      timestamp: new Date().toISOString(),
      confidence: claim.confidence.toLowerCase() as 'low' | 'medium' | 'high'
    });
  }

  // 3. Top trace highlights => Reason (bounded to remaining slots, max 2)
  const remainingSlots = MAX_THOUGHT_OBJECTS - objects.length;
  if (remainingSlots > 0) {
    const highlights = extractTraceHighlights(trace, Math.min(remainingSlots, 2));
    for (let i = 0; i < highlights.length && objects.length < MAX_THOUGHT_OBJECTS; i++) {
      const highlight = highlights[i];
      objects.push({
        id: `${baseId}_trace_${i}`,
        type: 'Evidence' as ThoughtObjectType, // Using Evidence for trace highlights
        content: highlight.length > 150 
          ? highlight.substring(0, 147) + '...' 
          : highlight,
        source: 'system' as ThoughtObjectSource,
        timestamp: new Date().toISOString(),
        confidence: 'medium' as 'low' | 'medium' | 'high'
      });
    }
  }

  return objects;
}

/**
 * Extracts top trace highlights (deterministic, bounded).
 */
function extractTraceHighlights(trace: DecisionTrace, maxHighlights: number): string[] {
  const highlights: string[] = [];

  // Prioritize Decision and Policy nodes
  const priorityNodes = trace.nodes.filter(node => 
    node.type === 'Decision' || node.type === 'Policy'
  );

  // Take top N priority nodes
  for (let i = 0; i < Math.min(priorityNodes.length, maxHighlights); i++) {
    const node = priorityNodes[i];
    const text = `${node.label}: ${node.description}`;
    highlights.push(text);
  }

  // Fill remaining slots with other nodes if needed
  if (highlights.length < maxHighlights) {
    const otherNodes = trace.nodes.filter(node => 
      node.type !== 'Decision' && node.type !== 'Policy'
    );
    for (let i = 0; i < Math.min(otherNodes.length, maxHighlights - highlights.length); i++) {
      const node = otherNodes[i];
      const text = `${node.label}: ${node.description}`;
      highlights.push(text);
    }
  }

  return highlights;
}

