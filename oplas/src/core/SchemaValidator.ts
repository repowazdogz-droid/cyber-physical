/**
 * Schema Validator
 * 
 * Validates canonical representation against schema.
 * Gate 1a: Basic structure validation.
 * 
 * Version: 1.0.0
 */

import { CanonicalRepresentation } from '../contracts/types/Repr';

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a canonical representation.
 * Tier 0: Schema validation + type checks.
 */
export function validateSchema(repr: CanonicalRepresentation): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!repr.repr_id) {
    errors.push('Missing repr_id');
  }
  if (!repr.schema_version) {
    errors.push('Missing schema_version');
  }
  if (!repr.domain) {
    errors.push('Missing domain');
  }
  if (!Array.isArray(repr.nodes)) {
    errors.push('nodes must be an array');
  }
  if (!Array.isArray(repr.edges)) {
    errors.push('edges must be an array');
  }
  if (!repr.provenance) {
    errors.push('Missing provenance');
  }

  if (errors.length > 0) {
    return { ok: false, errors, warnings };
  }

  // Validate nodes
  const nodeIds = new Set<string>();
  for (let i = 0; i < repr.nodes.length; i++) {
    const node = repr.nodes[i];
    
    if (!node.id) {
      errors.push(`Node ${i} missing id`);
    } else {
      if (nodeIds.has(node.id)) {
        errors.push(`Duplicate node id: ${node.id}`);
      }
      nodeIds.add(node.id);
    }

    if (!node.type) {
      errors.push(`Node ${i} missing type`);
    }

    // Validate bbox if present in attrs
    const attrs = node.attrs as any;
    if (attrs?.bbox) {
      const bbox = attrs.bbox;
      const { x_min, y_min, x_max, y_max } = bbox;
      if (typeof x_min !== 'number' || typeof y_min !== 'number' ||
          typeof x_max !== 'number' || typeof y_max !== 'number') {
        errors.push(`Node ${i} bbox has invalid types`);
      }
      if (x_min >= x_max || y_min >= y_max) {
        errors.push(`Node ${i} bbox is invalid (min >= max)`);
      }
    }
  }

  // Validate edges
  for (let i = 0; i < repr.edges.length; i++) {
    const edge = repr.edges[i];
    
    if (!edge.src) {
      errors.push(`Edge ${i} missing src`);
    } else if (!nodeIds.has(edge.src)) {
      errors.push(`Edge ${i} references unknown src: ${edge.src}`);
    }

    if (!edge.type) {
      errors.push(`Edge ${i} missing type`);
    }

    if (!edge.dst) {
      errors.push(`Edge ${i} missing dst`);
    } else if (!nodeIds.has(edge.dst)) {
      errors.push(`Edge ${i} references unknown dst: ${edge.dst}`);
    }
  }

  // Check bounds
  if (repr.nodes.length > 1000) {
    warnings.push(`Large number of nodes: ${repr.nodes.length}`);
  }
  if (repr.edges.length > 5000) {
    warnings.push(`Large number of edges: ${repr.edges.length}`);
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings
  };
}

