/**
 * Kernel Graph Runner
 * 
 * Runs a graph of kernels deterministically.
 * Topological ordering, policy-aware, bounded, explainable.
 * 
 * Version: 1.0.0
 */

import { OrchestratorInput, OrchestratorRun, OrchestratorNodeResult, KernelNodeSpec } from './OrchestratorTypes';
import { getAdapter } from '../kernels/adapters/AdapterRegistry';
import { getPolicyPack } from '../policies/PolicyPackRegistry';
import { applyPolicyPack } from '../policies/applyPolicyPack';
import { KernelRunContract } from '../contracts/KernelContracts';
import { CONTRACT_VERSION } from '../contracts/ContractVersion';
import { createBoundedTrace, createSimplifiedDecision, createBoundedClaims } from '../kernels/surfaces/learning/KernelSurfaceTypes';
import { hashString } from '../learning/platform/session/hash';
import { extractTraceHighlights } from './TraceHighlighting';
import { getClaimDescriptor, listClaims } from '../claims/ClaimRegistry';
import { kernelToThoughtObjects } from '../kernels/surfaces/learning/KernelToThoughtObjects';
import { mergeOmegaMeta } from '../llm/modes/omegaMerge';
import type { OmegaMeta } from '../llm/modes/OmegaMeta';

/**
 * Runs a kernel graph.
 * Deterministic, bounded, policy-aware.
 */
export function runGraph(input: OrchestratorInput): OrchestratorRun {
  const { graphSpec, inputBag, globalPolicyPackId, runMeta } = input;
  
  // Validate bounds
  if (graphSpec.nodes.length > 25) {
    throw new Error('Graph exceeds max 25 nodes');
  }
  if (Object.keys(inputBag).length > 50) {
    throw new Error('Input bag exceeds max 50 keys');
  }

  // Get global policy pack if provided
  const globalPolicyPack = globalPolicyPackId ? getPolicyPack(globalPolicyPackId) : undefined;

  // Topological sort
  const sortedNodes = topologicalSort(graphSpec.nodes);
  
  // Hard cap max steps
  const maxSteps = Math.min(graphSpec.maxSteps || 25, 25);
  const nodesToProcess = sortedNodes.slice(0, maxSteps);

  // Run nodes in order
  const nodeResults: OrchestratorNodeResult[] = [];
  const allPolicyNotes: string[] = [];
  let omega: OmegaMeta | undefined = undefined;

  for (const nodeSpec of nodesToProcess) {
    const nodeResult = runNode(nodeSpec, inputBag, globalPolicyPack);
    nodeResults.push(nodeResult);
    allPolicyNotes.push(...nodeResult.policyNotes);
    // Merge omega from node result if present (extracted from underlying KernelResult)
    if (nodeResult.omega) {
      omega = mergeOmegaMeta(omega, nodeResult.omega);
    }
  }

  // Extract trace highlights
  const traceHighlights = extractTraceHighlights(nodeResults, 12);

  // Aggregate summary claims
  const summaryClaims = aggregateSummaryClaims(nodeResults);

  // Find terminal outcome
  const terminalNode = findTerminalNode(nodeResults, sortedNodes);
  const terminalOutcome = terminalNode?.runRecord.decision.outcomeId || 'INDETERMINATE';
  const terminalNodeId = terminalNode?.nodeId || '';

  return {
    contractVersion: CONTRACT_VERSION,
    graphId: graphSpec.graphId,
    sessionId: runMeta?.sessionId,
    learnerId: runMeta?.learnerId,
    startedAtIso: runMeta?.startedAtIso || new Date().toISOString(),
    nodes: nodeResults,
    summaryClaims: summaryClaims.slice(0, 12), // Bounded max 12
    policyNotes: allPolicyNotes.slice(0, 12), // Bounded max 12
    boundedTraceHighlights: traceHighlights.map(h => ({
      nodeId: h.nodeId,
      label: h.label,
      description: h.description,
      type: h.type
    })),
    terminalOutcome,
    terminalNodeId,
    omega
  };
}

/**
 * Runs a single node.
 */
function runNode(
  nodeSpec: KernelNodeSpec,
  inputBag: Record<string, Record<string, unknown>>,
  globalPolicyPack?: any
): OrchestratorNodeResult {
  // Get input from bag
  const nodeInput = inputBag[nodeSpec.inputRef];
  if (!nodeInput) {
    throw new Error(`Input not found for ref: ${nodeSpec.inputRef}`);
  }

  // Get adapter
  const adapter = getAdapter(nodeSpec.adapterId);
  if (!adapter) {
    throw new Error(`Adapter not found: ${nodeSpec.adapterId}`);
  }

  // Adapt input
  const kernelInput = adapter.adapt(nodeInput);

  // Run kernel
  const result = adapter.run(kernelInput);

  // Build KernelRunContract for policy pack application
  const inputHash = hashString(JSON.stringify({
    adapterId: nodeSpec.adapterId,
    kernelId: nodeSpec.kernelId,
    signals: kernelInput.signals,
    uncertainty: kernelInput.uncertainty,
    overrides: kernelInput.overrides
  }));

  const runId = hashString(`${inputHash}-${nodeSpec.kernelId}-${nodeSpec.nodeId}`);
  const runContract: KernelRunContract = {
    contractVersion: CONTRACT_VERSION,
    runId,
    kernelId: nodeSpec.kernelId,
    adapterId: nodeSpec.adapterId,
    input: {
      contractVersion: CONTRACT_VERSION,
      timestamp: kernelInput.timestamp,
      signals: kernelInput.signals,
      uncertainty: kernelInput.uncertainty,
      overrides: (kernelInput.overrides || {}) as Record<string, string | number | boolean>
    },
    decision: {
      contractVersion: CONTRACT_VERSION,
      outcome: result.decision.outcome,
      confidence: result.decision.confidence as "Low" | "Medium" | "High" | "Unknown",
      rationale: result.decision.rationale,
      assumptions: result.decision.assumptions,
      uncertainties: result.decision.uncertainties,
      overridesApplied: result.decision.overridesApplied,
      kernelId: nodeSpec.kernelId,
      adapterId: nodeSpec.adapterId
    },
    trace: {
      contractVersion: CONTRACT_VERSION,
      traceId: result.trace.traceId,
      nodes: result.trace.nodes.map(node => ({
        id: node.id,
        parentId: undefined,
        type: node.type as any,
        label: node.label,
        description: node.description,
        timestamp: node.timestamp,
        data: node.data,
        children: node.children?.map(child => ({
          id: child.id,
          parentId: child.id,
          type: child.type as any,
          label: child.label,
          description: child.description,
          timestamp: child.timestamp,
          data: child.data,
          children: undefined,
          level: 1
        })),
        level: 0
      })),
      claims: result.trace.claims.map(claim => ({
        contractVersion: CONTRACT_VERSION,
        type: claim.type as any,
        statement: claim.statement,
        evidence: claim.evidence?.map(ev => ({
          type: 'trace_node' as any,
          reference: typeof ev === 'string' ? ev : String(ev),
          description: undefined,
          data: undefined
        })),
        confidence: claim.confidence as "Low" | "Medium" | "High" | "Unknown",
        claimId: hashString(claim.statement)
      })),
      summary: result.trace.summary || '',
      kernelVersion: result.trace.version
    },
    createdAtIso: new Date().toISOString(),
    inputHash
  };

  // Apply node policy pack (if provided)
  let finalRunContract = runContract;
  let nodePolicyNotes: string[] = [];
  
  if (nodeSpec.policyPackId) {
    const nodePolicyPack = getPolicyPack(nodeSpec.policyPackId);
    if (nodePolicyPack) {
      const packResult = applyPolicyPack(runContract, nodePolicyPack);
      finalRunContract = packResult.run;
      nodePolicyNotes = packResult.policyNotes;
    }
  }

  // Apply global policy pack (if provided, after node policy)
  let globalPolicyNotes: string[] = [];
  if (globalPolicyPack) {
    const packResult = applyPolicyPack(finalRunContract, globalPolicyPack);
    finalRunContract = packResult.run;
    globalPolicyNotes = packResult.policyNotes;
  }

  // Convert to KernelRunRecord
  const runRecord = {
    runId: finalRunContract.runId,
    kernelId: finalRunContract.kernelId,
    adapterId: finalRunContract.adapterId,
    sessionId: undefined,
    learnerId: undefined,
    createdAtIso: finalRunContract.createdAtIso,
    inputHash: finalRunContract.inputHash,
    decision: createSimplifiedDecision({
      outcome: finalRunContract.decision.outcome,
      confidence: finalRunContract.decision.confidence,
      rationale: finalRunContract.decision.rationale,
      assumptions: finalRunContract.decision.assumptions,
      uncertainties: finalRunContract.decision.uncertainties,
      overridesApplied: finalRunContract.decision.overridesApplied
    }),
    claims: createBoundedClaims(result.trace.claims),
    trace: createBoundedTrace(result.trace, 20)
  };

  // Generate thought objects (optional, bounded max 5)
  const thoughtObjects = kernelToThoughtObjects(
    result.decision,
    result.trace,
    result.trace.claims,
    nodeSpec.kernelId,
    nodeSpec.adapterId
  ).slice(0, 5);

  return {
    nodeId: nodeSpec.nodeId,
    runRecord,
    policyNotes: [...nodePolicyNotes, ...globalPolicyNotes].slice(0, 3), // Bounded max 3
    thoughtObjects,
    omega: result.omega // Pass through omega from KernelResult if present
  };
}

/**
 * Topological sort of nodes.
 */
function topologicalSort(nodes: KernelNodeSpec[]): KernelNodeSpec[] {
  const sorted: KernelNodeSpec[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(node: KernelNodeSpec) {
    if (visiting.has(node.nodeId)) {
      throw new Error(`Circular dependency detected: ${node.nodeId}`);
    }
    if (visited.has(node.nodeId)) {
      return;
    }

    visiting.add(node.nodeId);

    // Visit dependencies first
    for (const depId of node.dependsOn) {
      const dep = nodes.find(n => n.nodeId === depId);
      if (dep) {
        visit(dep);
      }
    }

    visiting.delete(node.nodeId);
    visited.add(node.nodeId);
    sorted.push(node);
  }

  for (const node of nodes) {
    if (!visited.has(node.nodeId)) {
      visit(node);
    }
  }

  return sorted;
}

/**
 * Aggregates summary claims from all nodes.
 * Bounded max 12, ordered by severity then ID.
 */
function aggregateSummaryClaims(nodeResults: OrchestratorNodeResult[]): Array<{
  claimId: string;
  title: string;
  severity: "info" | "warn" | "critical";
  count: number;
}> {
  const claimMap = new Map<string, { title: string; severity: "info" | "warn" | "critical"; count: number }>();

  for (const nodeResult of nodeResults) {
    for (const claim of nodeResult.runRecord.claims) {
      // Try to get claim descriptor from registry
      const claimDescriptors = listClaims();
      const matchingDescriptor = claimDescriptors.find(desc => 
        desc.type === claim.type || desc.title.toLowerCase().includes(claim.text.toLowerCase().substring(0, 20))
      );

      const claimId = matchingDescriptor?.id || `claim_${claim.type}`;
      const title = matchingDescriptor?.title || claim.type;
      const severity = matchingDescriptor?.severity || "info";

      if (claimMap.has(claimId)) {
        const existing = claimMap.get(claimId)!;
        existing.count++;
      } else {
        claimMap.set(claimId, { title, severity, count: 1 });
      }
    }
  }

  // Sort by severity (critical > warn > info), then by claimId
  const sorted = Array.from(claimMap.entries())
    .map(([claimId, data]) => ({ claimId, ...data }))
    .sort((a, b) => {
      const severityOrder = { critical: 3, warn: 2, info: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return a.claimId.localeCompare(b.claimId);
    });

  return sorted.slice(0, 12); // Bounded max 12
}

/**
 * Finds terminal node (isTerminal=true or last node).
 */
function findTerminalNode(
  nodeResults: OrchestratorNodeResult[],
  sortedNodes: KernelNodeSpec[]
): OrchestratorNodeResult | undefined {
  // First, check for explicit terminal nodes
  for (const nodeSpec of sortedNodes) {
    if (nodeSpec.isTerminal) {
      return nodeResults.find(nr => nr.nodeId === nodeSpec.nodeId);
    }
  }

  // Otherwise, use last node
  if (nodeResults.length > 0) {
    return nodeResults[nodeResults.length - 1];
  }

  return undefined;
}




