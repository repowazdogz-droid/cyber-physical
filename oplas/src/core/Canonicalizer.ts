/**
 * Canonicalizer
 * 
 * Normalizes graph representation to canonical form.
 * Deterministic ordering, encoding, ID assignment.
 * 
 * Version: 1.0.0
 */

import { CanonicalRepresentation, Node, Edge } from './ReprTypes';

/**
 * Normalizes attributes (sets sorted, maps key-sorted).
 */
function normalizeAttrs(attrs: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};
  const keys = Object.keys(attrs).sort();

  for (const key of keys) {
    const value = attrs[key];
    if (Array.isArray(value)) {
      // Sort arrays (assuming primitive values)
      normalized[key] = [...value].sort();
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively normalize nested objects
      normalized[key] = normalizeAttrs(value);
    } else {
      normalized[key] = value;
    }
  }

  return normalized;
}

/**
 * Computes deterministic sort key for a node.
 * Format: (type, bbox.y_min, bbox.x_min, area, centroid_lex)
 */
function nodeSortKey(node: Node): string {
  const type = node.type;
  const bbox = node.bbox;
  
  if (!bbox) {
    // No bbox: sort by type only
    return `${type}::0::0::0::`;
  }

  const yMin = bbox.y_min;
  const xMin = bbox.x_min;
  const area = (bbox.x_max - bbox.x_min) * (bbox.y_max - bbox.y_min);
  const centroidX = (bbox.x_min + bbox.x_max) / 2;
  const centroidY = (bbox.y_min + bbox.y_max) / 2;
  const centroidLex = `${centroidX.toFixed(6)},${centroidY.toFixed(6)}`;

  // Pad numbers for lexicographic sort
  const pad = (n: number, width: number = 10) => {
    const s = n.toFixed(6);
    return s.padStart(width, '0');
  };

  return `${type}::${pad(yMin)}::${pad(xMin)}::${pad(area)}::${centroidLex}`;
}

/**
 * Canonicalizes a representation.
 * Assigns deterministic node IDs, sorts nodes and edges.
 */
export function canonicalize(repr: CanonicalRepresentation): CanonicalRepresentation {
  // Step 1: Normalize node attributes
  const normalizedNodes = repr.nodes.map(node => ({
    ...node,
    attrs: node.attrs ? normalizeAttrs(node.attrs) : {}
  }));

  // Step 2: Sort nodes by deterministic key
  const sortedNodes = [...normalizedNodes].sort((a, b) => {
    const keyA = nodeSortKey(a);
    const keyB = nodeSortKey(b);
    return keyA.localeCompare(keyB);
  });

  // Step 3: Assign canonical IDs (n0, n1, n2, ...)
  const idMap = new Map<string, string>(); // old_id → new_id
  const canonicalNodes: Node[] = sortedNodes.map((node, idx) => {
    const newId = `n${idx}`;
    idMap.set(node.id, newId);
    return {
      ...node,
      id: newId
    };
  });

  // Step 4: Remap edge source/dest IDs
  const remappedEdges = repr.edges.map(edge => ({
    ...edge,
    src_id: idMap.get(edge.src_id) || edge.src_id,
    dst_id: idMap.get(edge.dst_id) || edge.dst_id
  }));

  // Step 5: Normalize edge attributes
  const normalizedEdges = remappedEdges.map(edge => ({
    ...edge,
    attrs: edge.attrs ? normalizeAttrs(edge.attrs) : {}
  }));

  // Step 6: Sort edges lexicographically (src_id, edge_type, dst_id)
  const sortedEdges = [...normalizedEdges].sort((a, b) => {
    const keyA = `${a.src_id}::${a.edge_type}::${a.dst_id}`;
    const keyB = `${b.src_id}::${b.edge_type}::${b.dst_id}`;
    return keyA.localeCompare(keyB);
  });

  return {
    ...repr,
    nodes: canonicalNodes,
    edges: sortedEdges
  };
}























