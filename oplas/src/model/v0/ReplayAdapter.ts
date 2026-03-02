/**
 * Replay Model Adapter
 * 
 * Replay adapter that uses stored model responses.
 * 
 * Version: 1.0.0
 */

import { IModelAdapter } from './ModelAdapter';
import {
  ProposeProgramInput,
  ProposeProgramOutput,
  RepairProgramInput,
  RepairProgramOutput,
  AnnotateInput,
  AnnotateOutput
} from './types';
import { hashCanonical } from '../../contracts/invariants/CanonicalHashing';
import { loadModelCall } from './ModelResponseStorage';

/**
 * Replay Model Adapter that uses stored responses.
 */
export class ReplayModelAdapter implements IModelAdapter {
  model_id: string = 'replay';
  
  constructor(
    private taskRoot: string,
    private taskId: string,
    private runId: string
  ) {}

  async propose_program(input: ProposeProgramInput): Promise<ProposeProgramOutput> {
    const requestHash = hashCanonical(JSON.stringify(input));
    const stored = await loadModelCall(this.taskRoot, this.taskId, this.runId, 'propose', requestHash);

    if (!stored) {
      throw new Error(`No stored propose response for request hash ${requestHash} (Policy A: recorded-response replay enforced)`);
    }

    return stored.response as ProposeProgramOutput;
  }

  async repair_program(input: RepairProgramInput): Promise<RepairProgramOutput> {
    const requestHash = hashCanonical(JSON.stringify(input));
    const stored = await loadModelCall(this.taskRoot, this.taskId, this.runId, 'repair', requestHash);

    if (!stored) {
      throw new Error(`No stored repair response for request hash ${requestHash} (Policy A: recorded-response replay enforced)`);
    }

    return stored.response as RepairProgramOutput;
  }

  async annotate(input: AnnotateInput): Promise<AnnotateOutput> {
    const requestHash = hashCanonical(JSON.stringify(input));
    const stored = await loadModelCall(this.taskRoot, this.taskId, this.runId, 'annotate', requestHash);

    if (!stored) {
      throw new Error(`No stored annotate response for request hash ${requestHash} (Policy A: recorded-response replay enforced)`);
    }

    return stored.response as AnnotateOutput;
  }
}

