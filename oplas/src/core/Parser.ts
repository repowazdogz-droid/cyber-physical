/**
 * Deterministic Parser
 * 
 * Parses raw input into base graph structure.
 * NO LLM in parse path. Pure deterministic logic.
 * 
 * Version: 1.0.0
 */

import { RawInput, ParseResult, CanonicalRepresentation, Node, Edge } from './ReprTypes';

const PARSER_VERSION = '1.0.0';
const REPR_VERSION = '1.0.0';

/**
 * Parses raw input into base graph structure.
 * Deterministic: same input → same output.
 */
export function parse(input: RawInput): ParseResult {
  try {
    if (input.type !== 'graph') {
      return {
        ok: false,
        error: `Unsupported input type: ${input.type}`
      };
    }

    const { nodes = [], edges = [] } = input.data;

    // Validate bounds
    if (nodes.length > 1000) {
      return {
        ok: false,
        error: `Too many nodes: ${nodes.length} (max 1000)`
      };
    }
    if (edges.length > 5000) {
      return {
        ok: false,
        error: `Too many edges: ${edges.length} (max 5000)`
      };
    }

    // Parse nodes (assign temporary IDs if missing)
    const parsedNodes: Node[] = [];
    const nodeIdMap = new Map<string, string>(); // original_id → canonical_id

    for (let i = 0; i < nodes.length; i++) {
      const rawNode = nodes[i];
      const tempId = rawNode.id || `node_${i}`;
      const canonicalId = `n${i}`; // Will be reassigned by canonicalizer
      
      nodeIdMap.set(tempId, canonicalId);

      parsedNodes.push({
        id: canonicalId,
        type: rawNode.type,
        bbox: rawNode.bbox,
        attrs: rawNode.attrs || {}
      });
    }

    // Parse edges (map source/dest IDs)
    const parsedEdges: Edge[] = [];
    for (let i = 0; i < edges.length; i++) {
      const rawEdge = edges[i];
      const srcId = nodeIdMap.get(rawEdge.src);
      const dstId = nodeIdMap.get(rawEdge.dst);

      if (!srcId || !dstId) {
        return {
          ok: false,
          error: `Edge ${i} references unknown node: src=${rawEdge.src}, dst=${rawEdge.dst}`
        };
      }

      parsedEdges.push({
        src_id: srcId,
        edge_type: rawEdge.type,
        dst_id: dstId,
        attrs: rawEdge.attrs || {}
      });
    }

    // Create base representation (not yet canonicalized)
    const repr: CanonicalRepresentation = {
      repr_id: '', // Will be set by canonicalizer
      graph_type: 'graph',
      nodes: parsedNodes,
      edges: parsedEdges,
      meta: {
        version: REPR_VERSION,
        parser_version: PARSER_VERSION,
        created_at_iso: new Date().toISOString()
      }
    };

    return {
      ok: true,
      repr
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown parse error'
    };
  }
}























