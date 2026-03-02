/**
 * Grid 2D Canonicalizer
 * 
 * Canonicalizes grid_2d representations with stable ordering.
 * 
 * Version: 1.0.0
 */

import { CanonicalRepresentation, Node, Edge, Value } from '../../contracts/types/Repr';

/**
 * Normalizes attributes (sets sorted, maps key-sorted).
 */
function normalizeAttrs(attrs: Record<string, Value>): Record<string, Value> {
  const normalized: Record<string, Value> = {};
  const keys = Object.keys(attrs).sort();

  for (const key of keys) {
    const value = attrs[key];
    if (Array.isArray(value)) {
      // Sort arrays (assuming primitive values or objects with deterministic sort)
      if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
        // Sort array of objects (e.g., color_histogram)
        normalized[key] = [...value].sort((a: any, b: any) => {
          if (a.color !== undefined && b.color !== undefined) {
            return a.color - b.color;
          }
          return JSON.stringify(a).localeCompare(JSON.stringify(b));
        });
      } else {
        normalized[key] = [...value].sort();
      }
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively normalize nested objects
      normalized[key] = normalizeAttrs(value as Record<string, Value>);
    } else {
      normalized[key] = value;
    }
  }

  return normalized;
}

/**
 * Computes deterministic sort key for a grid_2d component node.
 * Tuple: (type_ordinal, bbox.y_min, bbox.x_min, area, color_histogram_lex, bbox.y_max, bbox.x_max)
 */
function componentSortKey(node: Node): string {
  const typeOrdinal = node.type === 'grid' ? 0 : 1;
  
  if (node.type === 'grid') {
    return `0::0::0::0::0::0::0`;
  }

  const attrs = node.attrs as any;
  const bbox = attrs.bbox;
  
  if (!bbox) {
    return `${typeOrdinal}::0::0::0::0::0::0`;
  }

  const yMin = bbox.y_min ?? 0;
  const xMin = bbox.x_min ?? 0;
  const area = attrs.area ?? 0;
  const yMax = bbox.y_max ?? 0;
  const xMax = bbox.x_max ?? 0;

  // Color histogram lexicographic encoding
  const histogram = attrs.color_histogram || [];
  const histogramLex = histogram
    .map((h: any) => `${h.color}:${h.count}`)
    .join(',');

  // Pad numbers for lexicographic sort
  const pad = (n: number, width: number = 10) => {
    return String(n).padStart(width, '0');
  };

  return `${typeOrdinal}::${pad(yMin)}::${pad(xMin)}::${pad(area)}::${histogramLex}::${pad(yMax)}::${pad(xMax)}`;
}

/**
 * Canonicalizes a grid_2d representation.
 */
export function canonicalizeGrid(repr: CanonicalRepresentation): CanonicalRepresentation {
  // Step 1: Normalize node attributes
  const normalizedNodes = repr.nodes.map(node => ({
    ...node,
    attrs: normalizeAttrs(node.attrs)
  }));

  // Step 2: Sort nodes by deterministic key
  const sortedNodes = [...normalizedNodes].sort((a, b) => {
    const keyA = componentSortKey(a);
    const keyB = componentSortKey(b);
    return keyA.localeCompare(keyB);
  });

  // Step 3: Assign canonical IDs
  const idMap = new Map<string, string>();
  const canonicalNodes: Node[] = [];

  // Grid nodes always first (if present), get 'grid' ID
  const gridNodes = sortedNodes.filter(n => n.type === 'grid');
  for (const gridNode of gridNodes) {
    idMap.set(gridNode.id, 'grid');
    canonicalNodes.push({
      ...gridNode,
      id: 'grid'
    });
  }

  // Components get n0, n1, n2, ...
  const componentNodes = sortedNodes.filter(n => n.type === 'component');
  componentNodes.forEach((node, idx) => {
    const newId = `n${idx}`;
    idMap.set(node.id, newId);
    canonicalNodes.push({
      ...node,
      id: newId
    });
  });

  // Step 4: Remap edge source/dest IDs
  const remappedEdges = repr.edges.map(edge => {
    const newSrc = idMap.get(edge.src) || edge.src;
    const newDst = idMap.get(edge.dst) || edge.dst;
    return {
      ...edge,
      src: newSrc,
      dst: newDst
    };
  });

  // Step 5: Normalize edge attributes
  const normalizedEdges = remappedEdges.map(edge => ({
    ...edge,
    attrs: normalizeAttrs(edge.attrs)
  }));

  // Step 6: Sort edges lexicographically (src, edge_type, dst, attrs_lex)
  const sortedEdges = [...normalizedEdges].sort((a, b) => {
    const attrsLexA = JSON.stringify(a.attrs);
    const attrsLexB = JSON.stringify(b.attrs);
    const keyA = `${a.src}::${a.type}::${a.dst}::${attrsLexA}`;
    const keyB = `${b.src}::${b.type}::${b.dst}::${attrsLexB}`;
    return keyA.localeCompare(keyB);
  });

  return {
    ...repr,
    nodes: canonicalNodes,
    edges: sortedEdges
  };
}

