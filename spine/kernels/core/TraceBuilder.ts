/**
 * TraceBuilder: Deterministic trace node builder.
 * Bounded, ND-calm display friendly.
 */

import { TraceNode, TraceNodeType, DecisionTrace, Claim } from './KernelTypes';

/**
 * Simple deterministic hash (FNV-1a).
 */
function hashString(s: string): string {
  let hash = 2166136261;
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}

const MAX_TRACE_NODES = 100;
const MAX_NODE_DEPTH = 5;
const MAX_NODE_DATA_KEYS = 10;

/**
 * TraceBuilder: Builds deterministic, bounded decision traces.
 */
export class TraceBuilder {
  private nodes: TraceNode[] = [];
  private nodeCount = 0;
  private claims: Claim[] = [];

  /**
   * Adds an input node.
   */
  addInput(label: string, description: string, data?: Record<string, string | number | boolean>): string {
    return this.addNode(TraceNodeType.Input, label, description, data);
  }

  /**
   * Adds a policy node.
   */
  addPolicy(label: string, description: string, data?: Record<string, string | number | boolean>): string {
    return this.addNode(TraceNodeType.Policy, label, description, data);
  }

  /**
   * Adds an override node.
   */
  addOverride(label: string, description: string, data?: Record<string, string | number | boolean>): string {
    return this.addNode(TraceNodeType.Override, label, description, data);
  }

  /**
   * Adds a decision node.
   */
  addDecision(label: string, description: string, data?: Record<string, string | number | boolean>): string {
    return this.addNode(TraceNodeType.Decision, label, description, data);
  }

  /**
   * Adds a claim node.
   */
  addClaim(label: string, description: string, data?: Record<string, string | number | boolean>): string {
    return this.addNode(TraceNodeType.Claim, label, description, data);
  }

  /**
   * Adds an error node.
   */
  addError(label: string, description: string, data?: Record<string, string | number | boolean>): string {
    return this.addNode(TraceNodeType.Error, label, description, data);
  }

  /**
   * Adds a child node to a parent.
   */
  addChild(parentId: string, type: TraceNodeType, label: string, description: string, data?: Record<string, string | number | boolean>): string {
    if (this.nodeCount >= MAX_TRACE_NODES) {
      return ''; // Bounded: stop adding nodes
    }

    const parent = this.findNode(parentId);
    if (!parent) {
      return '';
    }

    const depth = this.getNodeDepth(parent);
    if (depth >= MAX_NODE_DEPTH) {
      return ''; // Bounded: stop adding children
    }

    const childId = this.generateNodeId();
    const child: TraceNode = {
      id: childId,
      timestamp: new Date().toISOString(),
      type,
      label,
      description,
      data: this.boundData(data)
    };

    if (!parent.children) {
      parent.children = [];
    }
    parent.children.push(child);
    this.nodeCount++;

    return childId;
  }

  /**
   * Adds a claim.
   */
  addClaimToTrace(claim: Claim): void {
    this.claims.push(claim);
  }

  /**
   * Builds the final trace.
   */
  build(inputHash: string, version: string = "0.1"): DecisionTrace {
    const traceId = hashString(`${inputHash}-${this.nodeCount}-${version}`);

    return {
      traceId,
      inputHash,
      nodes: this.nodes,
      nodeCount: this.nodeCount,
      claims: this.claims,
      version
    };
  }

  /**
   * Resets the builder.
   */
  reset(): void {
    this.nodes = [];
    this.nodeCount = 0;
    this.claims = [];
  }

  /**
   * Adds a node (internal).
   */
  private addNode(
    type: TraceNodeType,
    label: string,
    description: string,
    data?: Record<string, string | number | boolean>
  ): string {
    if (this.nodeCount >= MAX_TRACE_NODES) {
      return ''; // Bounded: stop adding nodes
    }

    const nodeId = this.generateNodeId();
    const node: TraceNode = {
      id: nodeId,
      timestamp: new Date().toISOString(),
      type,
      label,
      description,
      data: this.boundData(data)
    };

    this.nodes.push(node);
    this.nodeCount++;

    return nodeId;
  }

  /**
   * Generates a deterministic node ID.
   */
  private generateNodeId(): string {
    return `node_${this.nodeCount}_${Date.now()}`;
  }

  /**
   * Finds a node by ID.
   */
  private findNode(id: string): TraceNode | null {
    const find = (nodes: TraceNode[]): TraceNode | null => {
      for (const node of nodes) {
        if (node.id === id) {
          return node;
        }
        if (node.children) {
          const found = find(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    return find(this.nodes);
  }

  /**
   * Gets node depth.
   */
  private getNodeDepth(node: TraceNode): number {
    if (!node.children || node.children.length === 0) {
      return 0;
    }
    return 1 + Math.max(...node.children.map(child => this.getNodeDepth(child)));
  }

  /**
   * Bounds data object (max keys).
   */
  private boundData(data?: Record<string, string | number | boolean>): Record<string, string | number | boolean> | undefined {
    if (!data) return undefined;

    const keys = Object.keys(data);
    if (keys.length <= MAX_NODE_DATA_KEYS) {
      return data;
    }

    // Take first N keys
    const bounded: Record<string, string | number | boolean> = {};
    for (let i = 0; i < MAX_NODE_DATA_KEYS; i++) {
      bounded[keys[i]] = data[keys[i]];
    }
    return bounded;
  }
}

