/**
 * KernelSurfaceTypes: Types for kernel-to-learning platform integration.
 * Bounded, visibility-filter friendly, ND-calm.
 */

import { KernelDecision, DecisionTrace, TraceNode, Claim } from '../../core/KernelTypes';

/**
 * KernelRunRecord: Bounded record for storing kernel runs.
 * Visibility-filter friendly (no internal/system debug strings).
 */
export interface KernelRunRecord {
  /** Unique run ID (deterministic hash) */
  runId: string;
  /** Kernel identifier (e.g., "safe_landing_decision_square_v2_3") */
  kernelId: string;
  /** Adapter identifier (e.g., "uav_safe_landing") */
  adapterId: string;
  /** Optional: Learning session ID if attached */
  sessionId?: string;
  /** Optional: Learner ID if persisted */
  learnerId?: string;
  /** Creation timestamp (ISO string) */
  createdAtIso: string;
  /** Input hash for reproducibility */
  inputHash: string;
  /** Decision outcome (simplified for storage) */
  decision: {
    /** Outcome ID (domain-specific enum) */
    outcomeId: string;
    /** Human-readable label */
    label: string;
    /** Confidence level */
    confidence: "Low" | "Medium" | "High" | "Unknown";
    /** Short rationale (max 200 chars) */
    rationale: string;
  };
  /** Claims (bounded, max 10) */
  claims: Array<{
    /** Claim ID */
    id: string;
    /** Claim type */
    type: string;
    /** Short text (max 100 chars) */
    text: string;
  }>;
  /** Bounded trace nodes (safe subset, max 20 nodes, no internal/system markers) */
  trace: BoundedTraceNode[];
  /** Optional tags (bounded, max 5) */
  tags?: string[];
}

/**
 * BoundedTraceNode: Safe subset of trace node for storage.
 * No internal/system debug strings, bounded depth.
 */
export interface BoundedTraceNode {
  /** Node ID */
  id: string;
  /** Node type */
  type: "Input" | "Policy" | "Override" | "Decision" | "Claim" | "Error";
  /** Human-readable label */
  label: string;
  /** Short description (max 150 chars) */
  description: string;
  /** Timestamp (ISO string) */
  timestamp: string;
  /** Optional data (bounded, max 5 keys) */
  data?: Record<string, string | number | boolean>;
}

/**
 * Converts DecisionTrace to bounded trace for storage.
 * Filters out internal/system markers, limits depth and node count.
 */
export function createBoundedTrace(trace: DecisionTrace, maxNodes: number = 20): BoundedTraceNode[] {
  const bounded: BoundedTraceNode[] = [];
  let nodeCount = 0;

  const processNode = (node: TraceNode, depth: number = 0): void => {
    if (nodeCount >= maxNodes || depth > 3) {
      return; // Bounded: max 20 nodes, max depth 3
    }

    // Filter out internal/system markers
    const label = node.label || '';
    const description = node.description || '';
    
    if (label.toLowerCase().includes('internal') || 
        label.toLowerCase().includes('system') ||
        description.toLowerCase().includes('internal') ||
        description.toLowerCase().includes('system')) {
      return; // Skip internal nodes
    }

    // Bound description length
    const boundedDescription = description.length > 150 
      ? description.substring(0, 147) + '...' 
      : description;

    // Bound data keys (max 5)
    let boundedData: Record<string, string | number | boolean> | undefined;
    if (node.data) {
      const keys = Object.keys(node.data);
      if (keys.length > 5) {
        boundedData = {};
        for (let i = 0; i < 5; i++) {
          boundedData[keys[i]] = node.data[keys[i]];
        }
      } else {
        boundedData = node.data;
      }
    }

    bounded.push({
      id: node.id,
      type: node.type,
      label: label,
      description: boundedDescription,
      timestamp: node.timestamp,
      data: boundedData
    });

    nodeCount++;

    // Process children (bounded depth)
    if (node.children && depth < 3) {
      for (const child of node.children) {
        processNode(child, depth + 1);
      }
    }
  };

  for (const node of trace.nodes) {
    if (nodeCount >= maxNodes) break;
    processNode(node);
  }

  return bounded;
}

/**
 * Converts KernelDecision to simplified decision for storage.
 */
export function createSimplifiedDecision(decision: KernelDecision): KernelRunRecord['decision'] {
  return {
    outcomeId: decision.outcome,
    label: decision.outcome, // Domain adapter should provide label mapping
    confidence: decision.confidence,
    rationale: decision.rationale.length > 200 
      ? decision.rationale.substring(0, 197) + '...' 
      : decision.rationale
  };
}

/**
 * Converts Claim[] to bounded claims array (max 10, enforced).
 */
export function createBoundedClaims(claims: Claim[]): KernelRunRecord['claims'] {
  // Enforce max 10 claims
  const bounded = claims.slice(0, 10);
  return bounded.map((claim, idx) => ({
    id: `claim_${idx}`,
    type: claim.type,
    text: claim.statement.length > 100 
      ? claim.statement.substring(0, 97) + '...' 
      : claim.statement
  }));
}

