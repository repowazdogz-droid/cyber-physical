import { NextRequest, NextResponse } from 'next/server';
import { runGraph } from '../../../../spine/orchestrator/KernelGraphRunner';
import { OrchestratorInput } from '../../../../spine/orchestrator/OrchestratorTypes';
import { orchestratorToThoughtObjects } from '../../../../spine/kernels/surfaces/learning/OrchestratorToThoughtObjects';
import { getStore } from '../../../../spine/learning/platform/store/InMemoryStoreSingleton';
import { OrchestratorRunRecord } from '../../../../spine/learning/platform/store/OrchestratorRunTypes';
import { hashString } from '../../../../spine/learning/platform/session/hash';
import { CONTRACT_VERSION } from '../../../../spine/contracts/ContractVersion';
import { evaluateGate } from '../../../../spine/gates/GateEngine';
import { GateAction, ViewerRole, Surface } from '../../../../spine/gates/GateTypes';

// Import default policy packs to register them
import '../../../../spine/policies/packs/index';

interface OrchestratorRunRequest {
  graphSpec: {
    graphId: string;
    nodes: Array<{
      nodeId: string;
      adapterId: string;
      kernelId: string;
      inputRef: string;
      policyPackId?: string;
      dependsOn: string[];
      isTerminal?: boolean;
    }>;
    maxSteps?: number;
  };
  inputBag: Record<string, Record<string, unknown>>;
  globalPolicyPackId?: string;
  learnerId?: string;
  sessionId?: string;
  persist?: boolean;
  attachToBoard?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: OrchestratorRunRequest = await request.json();
    const {
      graphSpec,
      inputBag,
      globalPolicyPackId,
      learnerId,
      sessionId,
      persist = true,
      attachToBoard = true
    } = body;

    if (!graphSpec || !graphSpec.nodes || graphSpec.nodes.length === 0) {
      return NextResponse.json(
        { error: 'graphSpec with at least one node is required' },
        { status: 400 }
      );
    }

    // Gate: RUN_ORCHESTRATOR
    const runOrchestratorGate = evaluateGate(GateAction.RUN_ORCHESTRATOR, {
      viewerRole: ViewerRole.Learner,
      isMinor: false, // Could be determined from learnerId
      surface: Surface.OrchestratorDemo
    });

    if (!runOrchestratorGate.allowed) {
      return NextResponse.json(
        { error: runOrchestratorGate.reason },
        { status: 403 }
      );
    }

    // Build orchestrator input
    const policyPackIdRaw = globalPolicyPackId;
    const policyPackId = (typeof policyPackIdRaw === "string" && policyPackIdRaw.length > 0)
      ? (policyPackIdRaw as any)
      : undefined;
    
    const orchestratorInput: OrchestratorInput = {
      graphSpec: {
        graphId: graphSpec.graphId,
        nodes: graphSpec.nodes.map(node => ({
          ...node,
          ...(node.policyPackId ? { policyPackId: node.policyPackId as any } : {})
        })),
        maxSteps: graphSpec.maxSteps || 25,
        contractVersion: CONTRACT_VERSION
      },
      inputBag,
      ...(policyPackId ? { globalPolicyPackId: policyPackId } : {}),
      runMeta: {
        sessionId,
        learnerId,
        startedAtIso: new Date().toISOString()
      }
    };

    // Run graph
    const orchestratorRun = runGraph(orchestratorInput);

    // Build OrchestratorRunRecord for storage
    const runRecord: OrchestratorRunRecord = {
      runId: hashString(`${orchestratorRun.graphId}-${orchestratorRun.startedAtIso}`),
      graphId: orchestratorRun.graphId,
      createdAtIso: orchestratorRun.startedAtIso,
      terminalOutcome: orchestratorRun.terminalOutcome,
      summaryClaims: orchestratorRun.summaryClaims,
      traceHighlights: orchestratorRun.boundedTraceHighlights,
      nodeRunIds: orchestratorRun.nodes.map(n => n.runRecord.runId)
    };

    // Persist if requested and learnerId provided
    if (persist && learnerId) {
      const store = getStore();
      store.appendOrchestratorRun(learnerId, runRecord);

      // Also persist individual kernel runs
      for (const nodeResult of orchestratorRun.nodes) {
        const nodeRun = {
          ...nodeResult.runRecord,
          sessionId,
          learnerId
        };
        store.appendKernelRun(learnerId, nodeRun);
      }
    }

    // Convert to ThoughtObjects if requested
    let thoughtObjects = undefined;
    if (attachToBoard && learnerId) {
      thoughtObjects = orchestratorToThoughtObjects(orchestratorRun);
    }

    return NextResponse.json({
      ok: true,
      orchestratorRun: {
        contractVersion: orchestratorRun.contractVersion,
        graphId: orchestratorRun.graphId,
        sessionId: orchestratorRun.sessionId,
        learnerId: orchestratorRun.learnerId,
        startedAtIso: orchestratorRun.startedAtIso,
        terminalOutcome: orchestratorRun.terminalOutcome,
        terminalNodeId: orchestratorRun.terminalNodeId,
        summaryClaims: orchestratorRun.summaryClaims,
        policyNotes: orchestratorRun.policyNotes,
        boundedTraceHighlights: orchestratorRun.boundedTraceHighlights,
        nodeCount: orchestratorRun.nodes.length
      },
      thoughtObjects,
      policyNotes: orchestratorRun.policyNotes.length > 0 ? orchestratorRun.policyNotes : undefined
    });
  } catch (error: any) {
    console.error('Failed to run orchestrator:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run orchestrator' },
      { status: 500 }
    );
  }
}

