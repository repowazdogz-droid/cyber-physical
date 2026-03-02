/**
 * Explainable Panel
 * 
 * Main component that composes all explainable UI elements.
 * Works for both KernelRunRecord and OrchestratorRun.
 * 
 * Version: 1.0.0
 */

import React from 'react';
import { KernelRunRecord } from '@spine/kernels/surfaces/learning/KernelSurfaceTypes';
import { OrchestratorRun } from '@spine/orchestrator/OrchestratorTypes';
import { ExplainableModelOptions } from './ExplainableTypes';
import { buildFromKernelRun, buildFromOrchestratorRun } from './ExplainableModelBuilder';
import OutcomeCard from './components/OutcomeCard';
import ClaimChips from './components/ClaimChips';
import PolicyNotes from './components/PolicyNotes';
import ReasoningAccordion from './components/ReasoningAccordion';
import TalkTrack from './components/TalkTrack';

interface ExplainablePanelProps {
  mode: "kernel" | "orchestrator";
  run: KernelRunRecord | OrchestratorRun;
  opts?: ExplainableModelOptions;
}

export default function ExplainablePanel({ mode, run, opts = {} }: ExplainablePanelProps) {
  // Build display model
  const model = mode === 'kernel'
    ? buildFromKernelRun(run as KernelRunRecord, opts)
    : buildFromOrchestratorRun(run as OrchestratorRun, opts);

  return (
    <div>
      <OutcomeCard model={model.outcome} calmMode={opts.calmMode} />
      <ClaimChips chips={model.claimChips} calmMode={opts.calmMode} />
      {model.policyNotes.length > 0 && (
        <PolicyNotes notes={model.policyNotes} calmMode={opts.calmMode} />
      )}
      {model.reasoningItems.length > 0 && (
        <ReasoningAccordion items={model.reasoningItems} calmMode={opts.calmMode} />
      )}
      {model.talkTrack && (
        <TalkTrack model={model.talkTrack} calmMode={opts.calmMode} />
      )}
    </div>
  );
}




