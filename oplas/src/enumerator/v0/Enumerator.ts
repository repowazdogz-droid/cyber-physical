/**
 * Tiny Enumerator
 * 
 * Bounded DSL sketch enumeration with verifier-guided pruning.
 * 
 * Version: 1.0.0
 */

import { Program } from '../../dsl/v0/types';
import { CanonicalRepresentation, Node } from '../../contracts/types/Repr';
import { Request } from '../../contracts/types/Request';
import { parseDSL, buildProgram } from '../../dsl/v0';
import { FrameMode } from '../../contracts/enums/FrameModes';
import { Grid } from '../../executor/v0/types';
import { execute } from '../../executor/v0/Executor';
import { VerifierResult, verify, VerifierContext } from '../../verifier/v0/Verifier';

/**
 * Enumerator configuration.
 */
export interface EnumeratorConfig {
  /** Max proposals */
  max_proposals: number;
  /** Max depth */
  max_depth: number;
  /** Stop early if N eligible found */
  stop_early_n?: number;
  /** Stop early if best cost below threshold */
  stop_early_cost_threshold?: number;
}

/**
 * Enumerator result.
 */
export interface EnumeratorResult {
  /** Generated programs */
  programs: Program[];
  /** Enumeration counts */
  counts: {
    total_generated: number;
    pruned_precheck: number;
    pruned_tier1: number;
    pruned_tier2: number;
    passed_tier2: number;
  };
  /** Prune reasons histogram */
  prune_reasons: Record<string, number>;
  /** Top candidates by cost */
  top_candidates: Array<{
    program_id: string;
    cost: number;
    tier: number;
  }>;
}

/**
 * Predicate type.
 */
export type Predicate = 
  | { type: 'by_color'; color: number }
  | { type: 'area_ge'; threshold: number }
  | { type: 'touches_border'; value: boolean }
  | { type: 'bbox_position'; bucket: 'top' | 'left' | 'right' | 'bottom' };

/**
 * Extracts parameters from representation.
 */
export function extractParameters(repr: CanonicalRepresentation): {
  colors: number[];
  area_thresholds: number[];
  bbox_buckets: Array<'top' | 'left' | 'right' | 'bottom'>;
} {
  const colors = new Set<number>();
  const areas = new Set<number>();
  
  // Extract from grid node
  const gridNode = repr.nodes.find(n => n.type === 'grid');
  if (gridNode?.attrs.palette_size) {
    const paletteSize = gridNode.attrs.palette_size as number;
    for (let i = 0; i < paletteSize; i++) {
      colors.add(i);
    }
  }

  // Extract from component nodes
  for (const node of repr.nodes) {
    if (node.type === 'component') {
      const attrs = node.attrs as any;
      if (attrs.bbox) {
        const bbox = attrs.bbox;
        // Extract color from histogram
        if (attrs.color_histogram) {
          const histogram = attrs.color_histogram as Array<{ color: number; count: number }>;
          for (const entry of histogram) {
            colors.add(entry.color);
          }
        }
        // Extract area
        if (attrs.area) {
          areas.add(attrs.area as number);
        }
      }
    }
  }

  // Compute area thresholds (min, median, max)
  const sortedAreas = Array.from(areas).sort((a, b) => a - b);
  const areaThresholds: number[] = [];
  if (sortedAreas.length > 0) {
    areaThresholds.push(sortedAreas[0]); // min
    if (sortedAreas.length > 1) {
      const median = sortedAreas[Math.floor(sortedAreas.length / 2)];
      areaThresholds.push(median);
    }
    areaThresholds.push(sortedAreas[sortedAreas.length - 1]); // max
  }

  return {
    colors: Array.from(colors).sort((a, b) => a - b),
    area_thresholds: areaThresholds,
    bbox_buckets: ['top', 'left', 'right', 'bottom']
  };
}

/**
 * Generates predicates deterministically.
 */
export function generatePredicates(params: ReturnType<typeof extractParameters>): Predicate[] {
  const predicates: Predicate[] = [];

  // by_color predicates
  for (const color of params.colors) {
    predicates.push({ type: 'by_color', color });
  }

  // area_ge predicates
  for (const threshold of params.area_thresholds) {
    predicates.push({ type: 'area_ge', threshold });
  }

  // touches_border
  predicates.push({ type: 'touches_border', value: true });

  // bbox_position buckets
  for (const bucket of params.bbox_buckets) {
    predicates.push({ type: 'bbox_position', bucket });
  }

  return predicates;
}

/**
 * Converts predicate to DSL expression.
 * For v0, select_components only supports true (select all).
 */
function predicateToDSL(predicate: Predicate): string {
  // For v0, select_components only supports true predicate
  // In a full implementation, we'd generate proper predicate DSL based on predicate type
  return 'true';
}

/**
 * Generates DSL sketch for chain A: select -> mask -> recolor.
 * recolor signature: recolor(grid, mask, from?, to)
 * For v0, we generate both with and without from parameter.
 */
function generateChainA(
  predicate: Predicate,
  fromColor: number | null,
  toColor: number
): string {
  const predDSL = predicateToDSL(predicate);
  if (fromColor !== null) {
    // recolor(grid, mask, from, to) - 4 args
    return `(seq (let selected (select_components repr ${predDSL})) (let mask (mask_from_objects repr selected)) (recolor grid mask ${fromColor} ${toColor}))`;
  } else {
    // recolor(grid, mask, to) - 3 args (no from)
    return `(seq (let selected (select_components repr ${predDSL})) (let mask (mask_from_objects repr selected)) (recolor grid mask ${toColor}))`;
  }
}

/**
 * Generates DSL sketch for chain B: select -> crop.
 */
function generateChainB(predicate: Predicate): string {
  const predDSL = predicateToDSL(predicate);
  return `(seq (let selected (select_components repr ${predDSL})) (crop_to_bbox grid selected))`;
}

/**
 * Generates DSL sketch for chain C: select -> mask -> crop.
 */
function generateChainC(predicate: Predicate): string {
  const predDSL = predicateToDSL(predicate);
  return `(seq (let selected (select_components repr ${predDSL})) (let mask (mask_from_objects repr selected)) (crop_to_bbox grid mask))`;
}

/**
 * Generates all DSL sketches deterministically.
 */
export function generateSketches(
  repr: CanonicalRepresentation,
  request: Request
): string[] {
  const params = extractParameters(repr);
  const predicates = generatePredicates(params);
  const sketches: string[] = [];

  // Chain A: select -> mask -> recolor
  for (const predicate of predicates) {
    for (const fromColor of [null, ...params.colors]) {
      for (const toColor of params.colors) {
        if (fromColor === toColor) continue; // Skip no-op
        sketches.push(generateChainA(predicate, fromColor, toColor));
      }
    }
  }

  // Chain B: select -> crop
  for (const predicate of predicates) {
    sketches.push(generateChainB(predicate));
  }

  // Chain C: select -> mask -> crop
  for (const predicate of predicates) {
    sketches.push(generateChainC(predicate));
  }

  return sketches;
}

/**
 * Pre-check pruning (fast).
 */
function preCheckPrune(
  program: Program,
  repr: CanonicalRepresentation,
  inputGrid: Grid
): { ok: boolean; reason?: string } {
  // Check frame rules (already enforced by parser)
  // Check type rules (already enforced by parser)
  
  // Check if select_components returns empty on first example
  // This is a simplified check - in full implementation, we'd execute select_components
  // For v0, we skip this check (would require partial execution)
  
  // Check runtime_steps bound (would require execution)
  // For v0, we skip this check
  
  return { ok: true };
}

/**
 * Enumerates DSL programs with pruning.
 */
export async function enumeratePrograms(
  repr: CanonicalRepresentation,
  request: Request,
  inputGrid: Grid,
  examples?: Array<{ input_grid: Grid; expected_output_grid: Grid }>,
  config: EnumeratorConfig = { max_proposals: 100, max_depth: 3 }
): Promise<EnumeratorResult> {
  const sketches = generateSketches(repr, request);
  const programs: Program[] = [];
  const counts = {
    total_generated: 0,
    pruned_precheck: 0,
    pruned_tier1: 0,
    pruned_tier2: 0,
    passed_tier2: 0
  };
  const pruneReasons: Record<string, number> = {};
  const topCandidates: Array<{ program_id: string; cost: number; tier: number }> = [];

  for (const sketch of sketches) {
    if (programs.length >= config.max_proposals) {
      break;
    }

    counts.total_generated++;

    // Parse and build program
    const parse = parseDSL(`(program frame:RELATIVE ${sketch})`);
    if (!parse.ok || !parse.ast || !parse.declared_frame) {
      counts.pruned_precheck++;
      pruneReasons['parse_failed'] = (pruneReasons['parse_failed'] || 0) + 1;
      continue;
    }

    const build = buildProgram(parse.ast, parse.declared_frame);
    if (!build.ok || !build.program) {
      counts.pruned_precheck++;
      pruneReasons['build_failed'] = (pruneReasons['build_failed'] || 0) + 1;
      continue;
    }

    const program = build.program;

    // Pre-check pruning
    const preCheck = preCheckPrune(program, repr, inputGrid);
    if (!preCheck.ok) {
      counts.pruned_precheck++;
      pruneReasons[preCheck.reason || 'precheck_failed'] = (pruneReasons[preCheck.reason || 'precheck_failed'] || 0) + 1;
      continue;
    }

    // Execute program
    const execResult = execute(program, repr, { grid: inputGrid });
    if (!execResult.ok) {
      counts.pruned_precheck++;
      pruneReasons['exec_error'] = (pruneReasons['exec_error'] || 0) + 1;
      continue;
    }

    // Verify program
    const verifierContext: VerifierContext = {
      request,
      repr,
      program,
      exec_result: execResult,
      input_grid: inputGrid,
      examples
    };

    const verifierResult = verify(verifierContext);

    // Tier 1 pruning
    if (!verifierResult.ok && verifierResult.highest_tier_passed < 1) {
      counts.pruned_tier1++;
      pruneReasons[verifierResult.why_failed || 'tier1_failed'] = (pruneReasons[verifierResult.why_failed || 'tier1_failed'] || 0) + 1;
      continue;
    }

    // Tier 2 check
    if (!verifierResult.ok && verifierResult.highest_tier_passed < 2) {
      counts.pruned_tier2++;
      pruneReasons[verifierResult.why_failed || 'tier2_failed'] = (pruneReasons[verifierResult.why_failed || 'tier2_failed'] || 0) + 1;
      continue;
    }

    // Passed Tier 2
    counts.passed_tier2++;
    programs.push(program);

    // Track top candidates
    const cost = verifierResult.cost_breakdown.total_cost;
    topCandidates.push({
      program_id: program.program_id,
      cost,
      tier: verifierResult.highest_tier_passed
    });

    // Stop early if configured
    if (config.stop_early_n && programs.length >= config.stop_early_n) {
      if (config.stop_early_cost_threshold && cost <= config.stop_early_cost_threshold) {
        break;
      }
    }
  }

  // Sort top candidates by cost
  topCandidates.sort((a, b) => a.cost - b.cost);

  return {
    programs,
    counts,
    prune_reasons: pruneReasons,
    top_candidates: topCandidates.slice(0, 5)
  };
}

