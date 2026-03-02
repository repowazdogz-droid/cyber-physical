import { NextRequest, NextResponse } from 'next/server';
import { getAdapter } from '../../../../spine/kernels/adapters/AdapterRegistry';
import { KernelInput } from '../../../../spine/kernels/core/KernelTypes';
import { KernelRunRecord, createBoundedTrace, createSimplifiedDecision, createBoundedClaims } from '../../../../spine/kernels/surfaces/learning/KernelSurfaceTypes';
import { kernelToThoughtObjects } from '../../../../spine/kernels/surfaces/learning/KernelToThoughtObjects';
import { hashString } from '../../../../spine/learning/platform/session/hash';
import { getStore } from '../../../../spine/learning/platform/store/InMemoryStoreSingleton';
import { getPolicyPack } from '../../../../spine/policies/PolicyPackRegistry';
import { applyPolicyPack } from '../../../../spine/policies/applyPolicyPack';
import { KernelRunContract } from '../../../../spine/contracts/KernelContracts';
import { CONTRACT_VERSION } from '../../../../spine/contracts/ContractVersion';
import { evaluateGate } from '../../../../spine/gates/GateEngine';
import { GateAction, ViewerRole, Surface } from '../../../../spine/gates/GateTypes';
import { SignalParseIssue, UncertaintyFlag } from '../../../../spine/kernels/adapters/toolkit/SignalTypes';

// Import default packs to register them
import '../../../../spine/policies/packs/index';

interface KernelRunRequest {
  learnerId?: string;
  sessionId?: string;
  adapterId: string;
  kernelId: string;
  input: Record<string, unknown>;
  persist?: boolean;
  attachToBoard?: boolean;
  policyPackId?: string;
  includeAdapterDiagnostics?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: KernelRunRequest = await request.json();
    const { learnerId, sessionId, adapterId, kernelId, input, persist = true, attachToBoard = true, policyPackId, includeAdapterDiagnostics = false } = body;

    if (!adapterId || !kernelId) {
      return NextResponse.json(
        { error: 'adapterId and kernelId are required' },
        { status: 400 }
      );
    }

    // Get adapter
    const adapter = getAdapter(adapterId);
    if (!adapter) {
      return NextResponse.json(
        { error: `Adapter not found: ${adapterId}` },
        { status: 404 }
      );
    }

    // Gate: RUN_KERNEL
    const runKernelGate = evaluateGate(GateAction.RUN_KERNEL, {
      viewerRole: ViewerRole.Learner, // Default, could be passed from request
      isMinor: false, // Default, could be determined from learnerId
      surface: Surface.KernelDemo
    });

    if (!runKernelGate.allowed) {
      return NextResponse.json(
        { error: runKernelGate.reason },
        { status: 403 }
      );
    }

    // Adapt input to KernelInput
    const kernelInput = adapter.adapt(input);

    // Collect adapter diagnostics if requested (opt-in)
    let adapterDiagnostics: {
      issues: SignalParseIssue[];
      uncertaintyFlags: UncertaintyFlag[];
      confidenceHint?: string;
    } | undefined;

    if (includeAdapterDiagnostics) {
      // Get diagnostics from adapter (if it exposes them)
      if ('getLastDiagnostics' in adapter && typeof adapter.getLastDiagnostics === 'function') {
        const diagnostics = (adapter as any).getLastDiagnostics();
        if (diagnostics) {
          adapterDiagnostics = {
            issues: diagnostics.issues.slice(0, 20), // Bound to max 20
            uncertaintyFlags: diagnostics.uncertaintyFlags.slice(0, 20), // Bound to max 20
            confidenceHint: diagnostics.confidenceHint
          };
        }
      }
    }

    // Run kernel
    const result = adapter.run(kernelInput);

    // Hash input deterministically (for reproducibility)
    const inputHash = hashString(JSON.stringify({
      adapterId,
      kernelId,
      signals: kernelInput.signals,
      uncertainty: kernelInput.uncertainty,
      overrides: kernelInput.overrides
    }));

    // Build KernelRunContract (for policy pack application)
    const runId = hashString(`${inputHash}-${kernelId}-${Date.now()}`);
    const runContract: KernelRunContract = {
      contractVersion: CONTRACT_VERSION,
      runId,
      kernelId,
      adapterId,
      input: {
        contractVersion: CONTRACT_VERSION,
        timestamp: kernelInput.timestamp,
        signals: kernelInput.signals,
        uncertainty: kernelInput.uncertainty,
        overrides: Object.fromEntries(
          Object.entries(kernelInput.overrides || {}).filter(([_, v]) => v !== undefined)
        ) as Record<string, string | number | boolean>,
        sessionId,
        learnerId
      },
      decision: {
        contractVersion: CONTRACT_VERSION,
        outcome: result.decision.outcome,
        confidence: result.decision.confidence as "Low" | "Medium" | "High" | "Unknown",
        rationale: result.decision.rationale,
        assumptions: result.decision.assumptions,
        uncertainties: result.decision.uncertainties,
        overridesApplied: result.decision.overridesApplied,
        kernelId,
        adapterId
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
            reference: ev,
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

    // Apply policy pack if provided (opt-in)
    let finalRun = runContract;
    let policyNotes: string[] = [];
    if (policyPackId) {
      const pack = getPolicyPack(policyPackId as any);
      if (pack) {
        const packResult = applyPolicyPack(runContract, pack);
        finalRun = packResult.run;
        policyNotes = packResult.policyNotes;
      }
    }

    // Gate: SHOW_REASONING_TRACE (apply maxTraceNodes constraint if present)
    const traceGate = evaluateGate(GateAction.SHOW_REASONING_TRACE, {
      viewerRole: ViewerRole.Learner,
      isMinor: false,
      surface: Surface.KernelDemo
    });

    // Apply maxTraceNodes constraint to trace if present
    if (traceGate.allowed && traceGate.constraints?.maxTraceNodes && finalRun.trace.nodes) {
      finalRun.trace.nodes = finalRun.trace.nodes.slice(0, traceGate.constraints.maxTraceNodes);
    }

    // Convert to KernelRunRecord for storage
    const runRecord: KernelRunRecord = {
      runId: finalRun.runId,
      kernelId: finalRun.kernelId,
      adapterId: finalRun.adapterId,
      sessionId: finalRun.input.sessionId,
      learnerId: finalRun.input.learnerId,
      createdAtIso: finalRun.createdAtIso,
      inputHash: finalRun.inputHash,
      decision: {
        outcomeId: finalRun.decision.outcome,
        label: finalRun.decision.outcome,
        confidence: finalRun.decision.confidence,
        rationale: finalRun.decision.rationale
      },
      claims: finalRun.trace.claims.map(claim => ({
        id: claim.claimId,
        type: claim.type,
        text: claim.statement
      })),
      trace: finalRun.trace.nodes
        .filter(node => node.type !== 'Summary')
        .map(node => ({
          id: node.id,
          type: node.type as "Input" | "Policy" | "Override" | "Decision" | "Claim" | "Error",
          label: node.label || '',
          description: node.description || '',
          timestamp: node.timestamp
        }))
    };

    // Persist if requested and learnerId provided
    if (persist && learnerId) {
      const store = getStore();
      store.appendKernelRun(learnerId, runRecord);
    }

    // Gate: ATTACH_TO_BOARD
    let thoughtObjects = undefined;
    if (attachToBoard && learnerId) {
      const attachGate = evaluateGate(GateAction.ATTACH_TO_BOARD, {
        viewerRole: ViewerRole.Learner,
        isMinor: false, // Could be determined from learnerId
        surface: Surface.Learning
      });

      if (attachGate.allowed) {
        thoughtObjects = kernelToThoughtObjects(
          result.decision,
          result.trace,
          result.trace.claims,
          kernelId,
          adapterId
        );
      }
    }

    return NextResponse.json({
      ok: true,
      run: runRecord,
      thoughtObjects,
      policyNotes: policyNotes.length > 0 ? policyNotes : undefined,
      adapterDiagnostics: includeAdapterDiagnostics ? adapterDiagnostics : undefined
    });
  } catch (error: any) {
    console.error('Failed to run kernel:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run kernel' },
      { status: 500 }
    );
  }
}

