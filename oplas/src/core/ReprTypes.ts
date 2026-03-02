/**
 * Representation Types
 * 
 * Core types for canonical representations.
 * Gate 1a: Simple graph structure.
 * 
 * Version: 1.0.0
 */

/**
 * Node: A node in the graph representation.
 * Bounded: max 1000 nodes per graph.
 */
export interface Node {
  /** Node ID (assigned deterministically by canonicalizer) */
  id: string;
  /** Node type */
  type: string;
  /** Bounding box (for spatial graphs) */
  bbox?: {
    x_min: number;
    y_min: number;
    x_max: number;
    y_max: number;
  };
  /** Attributes (normalized: sets sorted, maps key-sorted) */
  attrs?: Record<string, any>;
}

/**
 * Edge: An edge in the graph representation.
 * Bounded: max 5000 edges per graph.
 */
export interface Edge {
  /** Source node ID */
  src_id: string;
  /** Edge type */
  edge_type: string;
  /** Destination node ID */
  dst_id: string;
  /** Edge attributes (normalized) */
  attrs?: Record<string, any>;
}

/**
 * CanonicalRepresentation: The canonical graph structure.
 * Content-addressable via repr_id (hash).
 */
export interface CanonicalRepresentation {
  /** Representation ID (content hash) */
  repr_id: string;
  /** Graph type */
  graph_type: string;
  /** Nodes (sorted deterministically) */
  nodes: Node[];
  /** Edges (sorted deterministically) */
  edges: Edge[];
  /** Metadata (version, parser version, etc.) */
  meta: {
    version: string;
    parser_version: string;
    created_at_iso: string;
  };
}

/**
 * RawInput: Raw input that can be parsed.
 * Gate 1a: Simple JSON structure.
 */
export interface RawInput {
  /** Input type */
  type: 'graph';
  /** Raw data (JSON) */
  data: {
    nodes?: Array<{
      id?: string;
      type: string;
      bbox?: { x_min: number; y_min: number; x_max: number; y_max: number };
      attrs?: Record<string, any>;
    }>;
    edges?: Array<{
      src: string;
      type: string;
      dst: string;
      attrs?: Record<string, any>;
    }>;
  };
}

/**
 * ParseResult: Result of parsing raw input.
 */
export interface ParseResult {
  /** Success flag */
  ok: boolean;
  /** Parsed representation (if ok) */
  repr?: CanonicalRepresentation;
  /** Error message (if not ok) */
  error?: string;
}























