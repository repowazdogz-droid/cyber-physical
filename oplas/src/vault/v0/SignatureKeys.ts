/**
 * Signature Keys
 * 
 * Extracts deterministic signature keys from concept cards and reprs.
 * 
 * Version: 1.0.0
 */

import { ConceptCard } from '../../contracts/types/ConceptCard';
import { CanonicalRepresentation } from '../../contracts/types/Repr';
import { Request } from '../../contracts/types/Request';
import { Domain } from '../../contracts/enums/Domains';

/**
 * Extracts signature keys from a concept card.
 */
export function signatureKeys(concept: ConceptCard): string[] {
  const keys: string[] = [];

  // Domain key
  keys.push(`domain:${concept.compatibility.repr_schema_version}`); // Note: This should be domain, but ConceptCard doesn't have domain field
  // We'll infer from signature or use a default

  // Extract keys from signature
  if (concept.signature.keys) {
    for (const key of concept.signature.keys) {
      // Parse key format: "transform:recolor", "invariant:same_dims", etc.
      keys.push(key);
    }
  }

  // Extract keys from proof obligations
  if (concept.proof_obligations) {
    for (const obligation of concept.proof_obligations) {
      keys.push(`invariant:${obligation}`);
    }
  }

  // Extract keys from template DSL (simple pattern matching)
  const templateDsl = concept.template.template_dsl;
  if (templateDsl.includes('recolor')) {
    keys.push('transform:recolor');
  }
  if (templateDsl.includes('crop')) {
    keys.push('transform:crop');
  }
  if (templateDsl.includes('select_components')) {
    keys.push('transform:select');
  }
  if (templateDsl.includes('mask_from_objects')) {
    keys.push('transform:mask');
  }
  if (templateDsl.includes('paste_at')) {
    keys.push('transform:paste');
  }

  // Deduplicate
  return Array.from(new Set(keys));
}

/**
 * Extracts keys from a representation and request.
 */
export function reprKeys(repr: CanonicalRepresentation, request: Request): string[] {
  const keys: string[] = [];

  // Domain key
  keys.push(`domain:${repr.domain}`);

  // Extract keys from repr globals
  if (repr.globals) {
    if (repr.globals.has_symmetry) {
      keys.push('feature:has_symmetry');
    }
    if (repr.globals.has_components !== undefined) {
      keys.push('feature:has_components');
    }
  }

  // Extract keys from nodes (component types)
  const componentTypes = new Set<string>();
  for (const node of repr.nodes) {
    if (node.type === 'component') {
      componentTypes.add('component');
    }
  }
  if (componentTypes.has('component')) {
    keys.push('feature:has_components');
  }

  // Extract keys from request constraints
  if (request.constraints) {
    for (const constraint of request.constraints) {
      if (constraint.type === 'same_dims') {
        keys.push('invariant:same_dims');
      }
      if (constraint.type === 'palette_preserved') {
        keys.push('invariant:palette_preserved');
      }
      if (constraint.type === 'fixed_dims') {
        keys.push('invariant:fixed_dims');
      }
    }
  }

  // Extract keys from edges (relations)
  const relationTypes = new Set<string>();
  for (const edge of repr.edges) {
    if (edge.type === 'adjacent_to') {
      relationTypes.add('adjacency');
    }
    if (edge.type === 'contained_in') {
      relationTypes.add('containment');
    }
    if (edge.type === 'aligned_with') {
      relationTypes.add('alignment');
    }
  }
  if (relationTypes.has('adjacency')) {
    keys.push('feature:has_adjacency');
  }
  if (relationTypes.has('containment')) {
    keys.push('feature:has_containment');
  }
  if (relationTypes.has('alignment')) {
    keys.push('feature:has_alignment');
  }

  // Deduplicate
  return Array.from(new Set(keys));
}























