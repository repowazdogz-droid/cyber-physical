/**
 * Orchestrator v0
 * 
 * Main orchestrator that runs tasks end-to-end.
 * 
 * Version: 1.0.0
 */

import { Request } from '../../contracts/types/Request';
import { Program } from '../../dsl/v0/types';
import { CanonicalRepresentation } from '../../contracts/types/Repr';
import { TaskRunInputs, RunSummary, CandidateResult, RunEvent } from './types';
import { evaluateCandidate } from './CandidateEvaluator';
import { selectWinner, SelectionResult } from './Selector';
import { parseGrid } from '../../domains/grid_2d/Parser';
import { canonicalizeGrid } from '../../domains/grid_2d/Canonicalizer';
import { hashCanonical } from '../../contracts/invariants/CanonicalHashing';
import { writeTaskBundle } from './ArtifactWriter';
import { retrieveConcepts } from '../../vault/v0/Retriever';
import { RetrievalMode } from '../../vault/v0/types';
import { instantiateConcept } from '../../vault/v0/Instantiator';
import { writeBackConcept, isEligibleForWriteBack, createConceptCard, WriteBackStrictness } from '../../vault/v0/WriteBack';
import { writeNegativeEvidence } from '../../vault/v0/Storage';
import { NegativeEvidence } from '../../vault/v0/types';
import { VerifierWhyCode } from '../../contracts/enums/VerifierCodes';
import { IModelAdapter, propose_program } from '../../model/v0/ModelAdapter';
import { storeModelCall } from '../../model/v0/ModelResponseStorage';
import { runRefinementLoop } from '../../model/v0/RefinementLoop';
import { TaskRunOptions } from './types';
import { ConceptShortlistEntry } from '../../model/v0/types';
import { enumeratePrograms } from '../../enumerator/v0/Enumerator';

/**
 * Runs a task end-to-end.
 */
export async function runTask(
  taskRequest: Request,
  candidatePrograms: Program[],
  inputs: TaskRunInputs,
  taskRoot: string,
  options?: TaskRunOptions
): Promise<RunSummary> {
  const run_id = `run_${Date.now()}`;
  const task_id = taskRequest.task_id;
  const events: RunEvent[] = [];
  let candidates_evaluated = 0;
  let candidates_eligible = 0;
  let budget_exhausted = false;
  
  const vaultRoot = options?.vaultRoot;
  const modelAdapter = options?.modelAdapter;
  const enableRefinement = options?.enableRefinement ?? false;
  const maxRefinementIterations = options?.maxRefinementIterations ?? 6;
  const enableTier3 = options?.enableTier3 ?? true;
  const enableTier4 = options?.enableTier4 ?? false;
  const writebackStrictness = options?.writebackStrictness ?? WriteBackStrictness.LEVEL_1;
  
  // Track model call indices
  let proposeCallIndex = 0;
  let repairCallIndex = 0;

  // Parse and canonicalize input grid -> repr
  const parseResult = parseGrid({ cells: inputs.grid });
  if (!parseResult.ok || !parseResult.repr) {
    return {
      run_id,
      task_id,
      ok: false,
      failure_reason: `Failed to parse input grid: ${parseResult.error}`,
      candidates_evaluated: 0,
      candidates_eligible: 0,
      events,
      budget_exhausted: false
    };
  }

  let repr = canonicalizeGrid(parseResult.repr);
  repr.repr_id = hashCanonical(repr);

  // Retrieve concepts from vault (if vault root provided)
  const allCandidatePrograms: Program[] = [...candidatePrograms];
  const programSourceMap = new Map<string, string>(); // program_id -> concept_id@version
  let conceptShortlist: ConceptShortlistEntry[] = [];
  
  if (vaultRoot) {
    try {
      const retrievalMode = options?.retrievalMode ?? RetrievalMode.SYMBOLIC_ONLY;
      const retrieval = await retrieveConcepts(repr, taskRequest, vaultRoot, 50, retrievalMode);
      
      // Build concept shortlist for model
      for (const concept of retrieval.concepts) {
        conceptShortlist.push({
          concept_id: concept.id,
          concept_version: concept.version,
          template_dsl: concept.template.template_dsl,
          signature_keys: concept.signature.keys || []
        });
      }
      
      // Record retrieval event with penalties and exclusions
      const keys = reprKeys(repr, taskRequest);
      const keyFingerprint = computeKeyFingerprint(keys);
      
      events.push({
        event_type: 'candidate_evaluated',
        timestamp_iso: new Date().toISOString(),
        details: {
          event: 'concepts_retrieved',
          keys_used: retrieval.keys_used,
          key_fingerprint: keyFingerprint,
          concept_ids: retrieval.concept_ids,
          count: retrieval.concepts.length,
          penalties: retrieval.penalties,
          exclusions: retrieval.exclusions
        }
      });

      // Instantiate concepts to programs
      for (const concept of retrieval.concepts) {
        const instantiation = instantiateConcept(concept, repr, taskRequest);
        if (instantiation.ok && instantiation.program) {
          allCandidatePrograms.push(instantiation.program);
          programSourceMap.set(instantiation.program.program_id, `${concept.id}@${concept.version}`);
          
          events.push({
            event_type: 'candidate_evaluated',
            timestamp_iso: new Date().toISOString(),
            program_id: instantiation.program.program_id,
            details: {
              event: 'concept_instantiated',
              concept_id: concept.id,
              concept_version: concept.version
            }
          });
        }
      }
    } catch (error) {
      // Vault retrieval failed - continue with fixtures only
      events.push({
        event_type: 'candidate_evaluated',
        timestamp_iso: new Date().toISOString(),
        details: {
          event: 'vault_retrieval_failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  // Enumerate programs if NO_MODEL mode (no adapter)
  if (!modelAdapter && vaultRoot) {
    try {
      const enumResult = await enumeratePrograms(
        repr,
        taskRequest,
        inputs.grid,
        inputs.examples,
        {
          max_proposals: taskRequest.budgets.max_proposals - allCandidatePrograms.length,
          max_depth: 3
        }
      );

      // Add enumerated programs
      for (const program of enumResult.programs) {
        allCandidatePrograms.push(program);
        
        events.push({
          event_type: 'candidate_evaluated',
          timestamp_iso: new Date().toISOString(),
          program_id: program.program_id,
          details: {
            event: 'enumerator_generated',
            source: 'enumerator'
          }
        });
      }

      // Log enumeration stats
      events.push({
        event_type: 'candidate_evaluated',
        timestamp_iso: new Date().toISOString(),
        details: {
          event: 'enumeration_completed',
          total_generated: enumResult.counts.total_generated,
          pruned_precheck: enumResult.counts.pruned_precheck,
          pruned_tier1: enumResult.counts.pruned_tier1,
          pruned_tier2: enumResult.counts.pruned_tier2,
          passed_tier2: enumResult.counts.passed_tier2,
          prune_reasons: enumResult.prune_reasons,
          top_candidates: enumResult.top_candidates
        }
      });
    } catch (error) {
      events.push({
        event_type: 'candidate_evaluated',
        timestamp_iso: new Date().toISOString(),
        details: {
          event: 'enumeration_failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  // Propose programs from model (if adapter provided)
  if (modelAdapter) {
    try {

      // Call propose_program
      const proposeInput = {
        request: taskRequest,
        repr,
        concept_shortlist,
        budgets: {
          max_candidates: Math.min(10, taskRequest.budgets.max_proposals - allCandidatePrograms.length),
          max_tokens: taskRequest.budgets.max_tokens_per_call
        }
      };

      const proposeResult = await propose_program(modelAdapter, proposeInput);
      
      if (proposeResult.ok && proposeResult.output) {
        // Store model call log with call index
        if (proposeResult.log) {
          await storeModelCall(taskRoot, task_id, run_id, proposeResult.log, proposeInput, proposeCallIndex);
          proposeCallIndex++;
        }

        // Parse and build proposed programs
        for (const candidate of proposeResult.output.candidates) {
          const parse = parseDSL(candidate.dsl.trim());
          if (parse.ok && parse.ast && parse.declared_frame) {
            const build = buildProgram(parse.ast, parse.declared_frame);
            if (build.ok && build.program) {
              allCandidatePrograms.push(build.program);
              
              events.push({
                event_type: 'candidate_evaluated',
                timestamp_iso: new Date().toISOString(),
                program_id: build.program.program_id,
                details: {
                  event: 'model_proposed',
                  model_id: modelAdapter.model_id,
                  expected_invariants: candidate.expected_invariants,
                  rationale_tags: candidate.rationale_tags
                }
              });
            }
          }
        }
      } else {
        events.push({
          event_type: 'candidate_evaluated',
          timestamp_iso: new Date().toISOString(),
          details: {
            event: 'model_propose_failed',
            error: proposeResult.error
          }
        });
      }
    } catch (error) {
      events.push({
        event_type: 'candidate_evaluated',
        timestamp_iso: new Date().toISOString(),
        details: {
          event: 'model_propose_error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  // Evaluate candidates
  const candidateResults: CandidateResult[] = [];
  const startTime = Date.now();

  for (const program of allCandidatePrograms) {
    // Check budget: max_proposals
    if (candidates_evaluated >= taskRequest.budgets.max_proposals) {
      budget_exhausted = true;
      events.push({
        event_type: 'budget_exhausted',
        timestamp_iso: new Date().toISOString(),
        details: { limit: 'max_proposals', value: candidates_evaluated, max: taskRequest.budgets.max_proposals }
      });
      break;
    }

    // Check budget: max_wall_ms
    const elapsed = Date.now() - startTime;
    if (elapsed >= taskRequest.budgets.max_wall_ms) {
      budget_exhausted = true;
      events.push({
        event_type: 'budget_exhausted',
        timestamp_iso: new Date().toISOString(),
        details: { limit: 'max_wall_ms', value: elapsed, max: taskRequest.budgets.max_wall_ms }
      });
      break;
    }

    // Evaluate candidate
    const result = evaluateCandidate(
      program,
      repr,
      taskRequest,
      inputs.grid,
      inputs.examples,
      {
        enable_tier3: enableTier3,
        enable_tier4: enableTier4
      }
    );

    candidates_evaluated++;
    candidateResults.push(result);

    // Write-back concept if eligible (if from vault)
    const sourceConceptId = programSourceMap.get(result.program.program_id);
    if (vaultRoot && sourceConceptId) {
      if (isEligibleForWriteBack(result.verifier_result, {
        enable_invariance_checks: enableTier3,
        strictness: writebackStrictness
      })) {
        // Create concept card and write back
        const concept = createConceptCard(result.program, result.verifier_result, repr, taskRequest, task_id);
        await writeBackConcept(vaultRoot, concept, task_id);
      } else {
        // Write negative evidence for failures
        const [conceptId, conceptVersion] = sourceConceptId.split('@');
        
        // Determine failure reason
        let whyCode = result.verifier_result.why_failed || 'unknown';
        if (result.verifier_result.ok && result.verifier_result.highest_tier_passed >= 2) {
          // Check Tier 4 failure
          if (result.verifier_result.tier4_result && !result.verifier_result.tier4_result.ok) {
            whyCode = VerifierWhyCode.GENERALIZATION_FAIL_TIER4;
          }
          // Passed tiers 0-2 but failed Tier 3 (generalization failure)
          else if (result.verifier_result.tier3_result && !result.verifier_result.tier3_result.palette_test_passed) {
            whyCode = VerifierWhyCode.INVARIANCE_FAILED_PALETTE;
          } else if (result.verifier_result.tier3_result && !result.verifier_result.tier3_result.translation_test_passed) {
            whyCode = VerifierWhyCode.INVARIANCE_FAILED_TRANSLATION;
          } else {
            whyCode = VerifierWhyCode.INVARIANCE_TEST_FAILED;
          }
        }
        
        const negativeEvidence: NegativeEvidence = {
          concept_id: conceptId,
          concept_version: conceptVersion || '1.0.0',
          repr_id: repr.repr_id,
          failure_tier: result.verifier_result.highest_tier_passed,
          why_code: whyCode,
          trace_id: result.trace_id,
          timestamp_iso: new Date().toISOString()
        };
        await writeNegativeEvidence(vaultRoot, negativeEvidence);
        
        // Update evidence index
        const keys = reprKeys(repr, taskRequest);
        const keyFingerprint = computeKeyFingerprint(keys);
        await updateEvidenceIndex(vaultRoot, negativeEvidence, repr.domain, keyFingerprint);
      }
    }

    // Record event
    if (result.verifier_result.ok && result.verifier_result.highest_tier_passed >= 2) {
      candidates_eligible++;
      events.push({
        event_type: 'candidate_eligible',
        timestamp_iso: new Date().toISOString(),
        program_id: program.program_id,
        details: {
          highest_tier_passed: result.verifier_result.highest_tier_passed,
          cost: result.cost_breakdown.total_cost
        }
      });
    } else {
      events.push({
        event_type: 'candidate_rejected',
        timestamp_iso: new Date().toISOString(),
        program_id: program.program_id,
        details: {
          highest_tier_passed: result.verifier_result.highest_tier_passed,
          why_failed: result.verifier_result.why_failed
        }
      });
    }

    events.push({
      event_type: 'candidate_evaluated',
      timestamp_iso: new Date().toISOString(),
      program_id: program.program_id,
      details: {
        ok: result.verifier_result.ok,
        highest_tier_passed: result.verifier_result.highest_tier_passed
      }
    });
  }

  // Run refinement loop if enabled and no winner yet
  if (enableRefinement && modelAdapter) {
    const eligible = candidateResults.filter(c => c.verifier_result.ok && c.verifier_result.highest_tier_passed >= 2);
    
    if (eligible.length === 0) {
      // No eligible candidates - try refinement
      const failures = candidateResults.filter(c => !c.verifier_result.ok || c.verifier_result.highest_tier_passed < 2);
      
      if (failures.length > 0) {
        // Compute budget guardrails (if cost/latency tracking available)
        const budgetGuardrails: BudgetGuardrails | undefined = undefined; // TODO: Extract from model calls
        
        // Log scheduling decision
        events.push({
          event_type: 'candidate_evaluated',
          timestamp_iso: new Date().toISOString(),
          details: {
            event: 'refinement_scheduled',
            failures_count: failures.length,
            max_iterations: maxRefinementIterations
          }
        });

        const refinementResult = await runRefinementLoop(
          modelAdapter,
          failures,
          repr,
          taskRequest,
          inputs.grid,
          inputs.examples,
          maxRefinementIterations,
          false, // writeback_target
          budgetGuardrails
        );

        // Log refinement result
        events.push({
          event_type: 'candidate_evaluated',
          timestamp_iso: new Date().toISOString(),
          details: {
            event: 'refinement_completed',
            ok: refinementResult.ok,
            iterations: refinementResult.iterations,
            attempts_count: refinementResult.attempts.length
          }
        });

        if (refinementResult.ok && refinementResult.final_result) {
          // Add repaired program to results
          candidateResults.push(refinementResult.final_result);
          
          events.push({
            event_type: 'candidate_evaluated',
            timestamp_iso: new Date().toISOString(),
            program_id: refinementResult.repaired_program!.program_id,
            details: {
              event: 'refinement_success',
              iterations: refinementResult.iterations
            }
          });
        } else {
          events.push({
            event_type: 'candidate_evaluated',
            timestamp_iso: new Date().toISOString(),
            details: {
              event: 'refinement_failed',
              iterations: refinementResult.iterations
            }
          });
        }
      }
    }
  }

  // Select winner
  const selection = selectWinner(candidateResults);

  let summary: RunSummary;

  if (selection.winner) {
    events.push({
      event_type: 'winner_selected',
      timestamp_iso: new Date().toISOString(),
      program_id: selection.winner.program.program_id,
      details: {
        cost_breakdown: selection.winner.cost_breakdown
      }
    });

    summary = {
      run_id,
      task_id,
      ok: true,
      winner_program_id: selection.winner.program.program_id,
      winner_result: selection.winner,
      candidates_evaluated,
      candidates_eligible,
      events,
      budget_exhausted
    };
  } else {
    events.push({
      event_type: 'run_failed',
      timestamp_iso: new Date().toISOString(),
      details: {
        reason: 'No eligible candidates',
        closest: selection.closest
      }
    });

    summary = {
      run_id,
      task_id,
      ok: false,
      failure_reason: 'No eligible candidates passed tiers 0-2',
      closest_candidate: selection.closest,
      candidates_evaluated,
      candidates_eligible,
      events,
      budget_exhausted
    };
  }

  // Write artifacts
  await writeTaskBundle(
    task_id,
    taskRoot,
    taskRequest,
    repr,
    candidateResults,
    summary,
    inputs.grid,
    inputs.examples
  );

  return summary;
}

