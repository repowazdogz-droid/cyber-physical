/**
 * Spec Run API
 * 
 * Runs a compiled kernel spec.
 * 
 * Version: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { runSpecKernel, getCompiledSpec } from '../../../../spine/specs/SpecKernelRunner';
import { KernelInput } from '../../../../spine/kernels/core/KernelTypes';
import { KernelRunner } from '../../../../spine/kernels/core/KernelRunner';
import { getAdapter } from '../../../../spine/kernels/adapters/AdapterRegistry';
import { CONTRACT_VERSION } from '../../../../spine/contracts/ContractVersion';
import { KernelRunContract } from '../../../../spine/contracts/KernelContracts';
import { TraceBuilder } from '../../../../spine/kernels/core/TraceBuilder';
import { getPolicyPack } from '../../../../spine/policies/PolicyPackRegistry';
import { applyPolicyPack } from '../../../../spine/policies/applyPolicyPack';
import { getStore } from '../../../../spine/learning/platform/store/InMemoryStoreSingleton';
import { KernelRunRecord } from '../../../../spine/kernels/surfaces/learning/KernelSurfaceTypes';
import { hashString } from '../../../../spine/learning/platform/session/hash';

interface RunRequest {
  compiledId: string;
  input: Record<string, unknown>;
  policyPackId?: string;
  persist?: boolean;
  learnerId?: string;
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RunRequest = await request.json();
    const { compiledId, input, policyPackId, persist = false, learnerId, sessionId } = body;

    if (!compiledId || !input) {
      return NextResponse.json(
        { error: 'compiledId and input are required' },
        { status: 400 }
      );
    }

    // Get compiled spec
    const spec = getCompiledSpec(compiledId);
    if (!spec) {
      return NextResponse.json(
        { error: 'Compiled spec not found' },
        { status: 404 }
      );
    }

    // Get adapter
    const adapter = getAdapter(compiledId);
    if (!adapter) {
      return NextResponse.json(
        { error: 'Adapter not found' },
        { status: 404 }
      );
    }

    // Adapt signals to kernel input
    const kernelInput = adapter.adapt(input);
    kernelInput.sessionId = sessionId;
    kernelInput.learnerId = learnerId;

    // Run kernel (using spec runner directly)
    const decision = runSpecKernel(compiledId, kernelInput);

    // Build trace
    const traceBuilder = new TraceBuilder();
    traceBuilder.addInput('Kernel Input', `Received ${Object.keys(kernelInput.signals).length} signals`);
    traceBuilder.addDecision(decision.outcome, decision.rationale);
    
    // Add override/disallow notes if applicable
    if (decision.overridesApplied && decision.overridesApplied.length > 0) {
      const override = spec.overrides?.find(o => o.overrideId === decision.overridesApplied![0]);
      traceBuilder.addOverride(decision.overridesApplied[0], override?.reason || 'Override applied');
    }

    const inputHash = hashString(JSON.stringify(kernelInput.signals));
    const trace = traceBuilder.build(inputHash);

    // Create run contract
    const runContract: KernelRunContract = {
      contractVersion: CONTRACT_VERSION,
      runId: `run_${Date.now()}_${hashString(JSON.stringify(kernelInput)).substring(0, 8)}`,
      kernelId: spec.kernelId,
      adapterId: compiledId,
      input: {
        contractVersion: CONTRACT_VERSION,
        timestamp: kernelInput.timestamp,
        signals: kernelInput.signals,
        uncertainty: Object.keys(kernelInput.uncertainty || {}).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {} as Record<string, boolean>),
        sessionId,
        learnerId
      },
      decision: {
        ...decision,
        contractVersion: CONTRACT_VERSION,
        kernelId: spec.kernelId,
        adapterId: compiledId
      },
      trace: {
        contractVersion: CONTRACT_VERSION,
        traceId: trace.traceId,
        nodes: trace.nodes.map((n: any) => ({
          id: n.id,
          parentId: n.parentId,
          type: n.type,
          label: n.label || "",
          description: n.description || "",
          timestamp: n.timestamp,
          data: n.data,
          children: n.children,
          level: n.level ?? 0
        })),
        claims: trace.claims.map((c: any) => ({
          contractVersion: CONTRACT_VERSION,
          claimId: c.claimId || hashString(c.statement || ""),
          type: c.type,
          statement: c.statement || "",
          evidence: c.evidence || [],
          confidence: c.confidence || "Unknown"
        })),
        summary: trace.summary || "",
        kernelVersion: spec.version || "1.0.0"
      },
      createdAtIso: new Date().toISOString(),
      inputHash: hashString(JSON.stringify(kernelInput))
    };

    // Apply policy pack if provided
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

    // Persist if requested
    if (persist && learnerId) {
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
          .filter((node: any) => node.type !== 'Summary')
          .map((node: any) => ({
            id: node.id,
            type: node.type as "Input" | "Policy" | "Override" | "Decision" | "Claim" | "Error",
            label: node.label || '',
            description: node.description || '',
            timestamp: node.timestamp
          }))
      };

      const store = getStore();
      store.appendKernelRun(learnerId, runRecord);
    }

    return NextResponse.json({
      ok: true,
      run: finalRun,
      policyNotes: policyNotes.length > 0 ? policyNotes : undefined
    });
  } catch (error: any) {
    console.error('Failed to run spec kernel:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run spec kernel' },
      { status: 500 }
    );
  }
}

