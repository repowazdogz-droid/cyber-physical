/**
 * Representation Types
 * 
 * Canonical representation structure.
 * 
 * Version: 1.0.0
 */

import { Domain } from '../enums/Domains';

/**
 * Value: JSON value (scalar, list, or map).
 * No floats unless quantized (or disallow floats entirely v0).
 */
export type Value = 
  | string 
  | number 
  | boolean 
  | null 
  | Value[] 
  | Record<string, Value>;

/**
 * Node: A node in the graph representation.
 */
export interface Node {
  /** Node ID (deterministic) */
  id: string;
  /** Node type (enum) */
  type: string;
  /** Attributes (deterministically encoded) */
  attrs: Record<string, Value>;
  /** LLM optional labels (allowed) */
  llm_optional_labels?: Record<string, Value>;
}

/**
 * Edge: An edge in the graph representation.
 */
export interface Edge {
  /** Source node ID */
  src: string;
  /** Destination node ID */
  dst: string;
  /** Edge type (enum) */
  type: string;
  /** Attributes (deterministically encoded) */
  attrs: Record<string, Value>;
}

/**
 * Provenance: Provenance information.
 */
export interface Provenance {
  /** Parser version */
  parser_version: string;
  /** Created at (ISO string) */
  created_at_iso: string;
  /** Source task ID */
  task_id?: string;
  /** Source artifact refs */
  source_refs?: string[];
}

/**
 * CanonicalRepresentation: Canonical representation structure.
 */
export interface CanonicalRepresentation {
  /** Representation ID (hash) */
  repr_id: string;
  /** Schema version (hash of JSON schema) */
  schema_version: string;
  /** Domain */
  domain: Domain;
  /** Nodes (ordered deterministically) */
  nodes: Node[];
  /** Edges (ordered deterministically) */
  edges: Edge[];
  /** Global attributes */
  globals: Record<string, Value>;
  /** Provenance */
  provenance: Provenance;
}

/**
 * Invariants:
 * - node ordering determined by canonical sort key (domain-specific)
 * - edges sorted lexicographically
 * - attrs encoded deterministically (sorted keys; normalized lists/sets)
 * - repr_id must match hash of canonical bytes
 */























