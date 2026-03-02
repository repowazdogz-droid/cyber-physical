/**
 * Stub Model Adapter
 * 
 * Stub implementation for testing.
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

/**
 * Stub Model Adapter for testing.
 */
export class StubModelAdapter implements IModelAdapter {
  model_id: string = 'stub';
  
  private proposals: Map<string, ProposeProgramOutput> = new Map();
  private repairs: Map<string, RepairProgramOutput> = new Map();

  /**
   * Sets a proposal response for a given input hash.
   */
  setProposal(inputHash: string, output: ProposeProgramOutput): void {
    this.proposals.set(inputHash, output);
  }

  /**
   * Sets a repair response for a given input hash.
   */
  setRepair(inputHash: string, output: RepairProgramOutput): void {
    this.repairs.set(inputHash, output);
  }

  async propose_program(input: ProposeProgramInput): Promise<ProposeProgramOutput> {
    const inputHash = JSON.stringify(input);
    const cached = this.proposals.get(inputHash);
    
    if (cached) {
      return cached;
    }

    // Default stub response
    return {
      candidates: [
        {
          dsl: '(seq (recolor (input) 0 1))',
          expected_invariants: ['shape_preserved'],
          rationale_tags: ['simple_recolor']
        }
      ],
      temperature_id: 'low'
    };
  }

  async repair_program(input: RepairProgramInput): Promise<RepairProgramOutput> {
    const inputHash = JSON.stringify(input);
    const cached = this.repairs.get(inputHash);
    
    if (cached) {
      return cached;
    }

    // Default stub response: return full DSL
    return {
      dsl_full: input.prior_program.dsl
    };
  }

  async annotate(input: AnnotateInput): Promise<AnnotateOutput> {
    return {
      labels: {}
    };
  }
}























