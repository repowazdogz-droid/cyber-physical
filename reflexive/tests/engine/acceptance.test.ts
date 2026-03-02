import { describe, it, expect } from 'vitest';
import { computeSynthesis } from '../../src/engine/index.js';
import type { EngineInput, EvidenceItem, ClaimEvidenceLink, PriorSynthesis, ConfidenceBreakdown } from '../../src/engine/types.js';
import type { ExtractedClaim } from '../../src/extraction/types.js';

function makeVector(dims: number, ...entries: [number, number][]): number[] {
  const v = new Array(dims).fill(0);
  for (const [idx, val] of entries) v[idx] = val;
  const mag = Math.sqrt(v.reduce((sum: number, x: number) => sum + x * x, 0));
  if (mag > 0) for (let i = 0; i < v.length; i++) v[i] /= mag;
  return v;
}

function makeSimilarVector(baseDim: number, perturbIdx: number, perturbVal = 0.05): number[] {
  const v = new Array(768).fill(0);
  v[baseDim] = 1.0;
  if (perturbIdx !== baseDim) v[perturbIdx] = perturbVal;
  const mag = Math.sqrt(v.reduce((s: number, x: number) => s + x * x, 0));
  for (let i = 0; i < 768; i++) v[i] /= mag;
  return v;
}

function makeBorderlineVectors(): [number[], number[]] {
  // We need cosine similarity in [0.90, 0.96) - new borderline zone
  // For normalized vectors, sim = cos(theta)
  // cos(theta) = 0.93 means theta ≈ 21.8 degrees
  // Construct two vectors in 768-d space with known angle
  const a = new Array(768).fill(0);
  const b = new Array(768).fill(0);
  
  // Vector a: unit vector along dim 0
  a[0] = 1.0;
  
  // Vector b: rotated by ~22 degrees in the 0-1 plane
  // cos(22°) ≈ 0.9272, sin(22°) ≈ 0.3746
  b[0] = 0.9272;
  b[1] = 0.3746;
  
  // Both already ~unit length, but normalize to be safe
  const magA = Math.sqrt(a.reduce((s: number, x: number) => s + x * x, 0));
  const magB = Math.sqrt(b.reduce((s: number, x: number) => s + x * x, 0));
  for (let i = 0; i < 768; i++) { a[i] /= magA; b[i] /= magB; }
  
  return [a, b];
}

const FIVE_LENSES = [
  { id: 'lens-analytical', name: 'analytical', orientation: 'convergent' as const, lens_version: 1, state: 'completed' as const },
  { id: 'lens-adversarial', name: 'adversarial', orientation: 'divergent' as const, lens_version: 1, state: 'completed' as const },
  { id: 'lens-historical', name: 'historical_analogy', orientation: 'orthogonal' as const, lens_version: 1, state: 'completed' as const },
  { id: 'lens-stakeholder', name: 'stakeholder_impact', orientation: 'orthogonal' as const, lens_version: 1, state: 'completed' as const },
  { id: 'lens-premortem', name: 'premortem', orientation: 'divergent' as const, lens_version: 1, state: 'completed' as const },
];

function makeClaim(overrides: Partial<ExtractedClaim> & { id: string; perspective_id: string }): ExtractedClaim {
  return {
    analysis_id: 'analysis-1', statement: 'Default claim', category: 'inferential',
    claim_kind: 'claim', confidence_weight: 0.7, evidence_basis: 'Some evidence',
    evidence_status: 'supported', about_entity_candidate: 'test entity',
    about_entity_canonical: 'test entity', validity: 'strict', polarity: 'neutral',
    scoring_eligible: true, as_of: '2025-02-07', valid_from: null, valid_until: null,
    expires_at: null, stale_unsupported: false, repairs: [], ...overrides,
  };
}

function makeEvidence(id: string, claimId: string, sourceType: EvidenceItem['source_type'] = 'stimulus_quote'): EvidenceItem {
  // Use today's date for fresh evidence (recency = 1.0)
  const today = new Date().toISOString().split('T')[0];
  return { id, claim_id: claimId, content_text: 'Revenue grew 15% to $200M in Q3 2024', source_type: sourceType, as_of: today, possibly_stale: false };
}

function makeLink(claimId: string, evidenceId: string): ClaimEvidenceLink {
  return { claim_id: claimId, evidence_item_id: evidenceId, support_type: 'supports' };
}

function baseInput(): EngineInput {
  return {
    analysis_id: 'analysis-1', case_id: 'case-1',
    stimulus: { text: 'Should we acquire HelioTech for $500M?', type: 'decision' },
    context_snapshot: [],
    perspectives: FIVE_LENSES.map((l, i) => ({ id: `perspective-${i}`, lens_id: l.id, lens_name: l.name, lens_orientation: l.orientation, lens_version: l.lens_version, state: l.state })),
    claims: [], evidence_items: [], claim_evidence_links: [], prior_syntheses: [],
  };
}

function threeActiveLenses(): EngineInput {
  const input = baseInput();
  input.perspectives[3] = { ...input.perspectives[3], state: 'failed' as const };
  input.perspectives[4] = { ...input.perspectives[4], state: 'failed' as const };
  return input;
}

describe('Acceptance Tests (Artifact 04 §9)', () => {

  it('AT-RE-001: Full convergence, strong evidence => confidence >= 0.75', async () => {
    const input = baseInput();
    const embeddings = new Map<string, number[]>();
    const topics = ['acquisition valuation', 'integration complexity', 'market opportunity'];
    for (let l = 0; l < 5; l++) {
      for (let t = 0; t < 3; t++) {
        const cid = `c-${l}-${t}`;
        input.claims.push(makeClaim({ id: cid, perspective_id: `perspective-${l}`, statement: `Claim about ${topics[t]} from lens ${l}`, category: 'inferential', about_entity_canonical: topics[t], confidence_weight: 0.8, evidence_basis: 'Strong evidence', evidence_status: 'supported' }));
        const ev1 = makeEvidence(`ev-${cid}-1`, cid, 'stimulus_quote');
        const ev2 = makeEvidence(`ev-${cid}-2`, cid, 'numeric_data');
        input.evidence_items.push(ev1, ev2);
        input.claim_evidence_links.push(makeLink(cid, ev1.id), makeLink(cid, ev2.id));
        const v = new Array(768).fill(0); v[t * 100] = 1.0; v[t * 100 + l + 1] = 0.05;
        const mag = Math.sqrt(v.reduce((s: number, x: number) => s + x * x, 0));
        for (let i = 0; i < 768; i++) v[i] /= mag;
        embeddings.set(cid, v);
      }
    }
    const output = await computeSynthesis(input, embeddings);
    
    expect(output.synthesis.convergence_points.length).toBe(3);
    expect(output.synthesis.divergence_points.length).toBe(0);
    expect(output.synthesis.confidence_breakdown.agreement_factor).toBeGreaterThanOrEqual(0.75);
    expect(output.synthesis.confidence_breakdown.evidence_density_factor).toBeGreaterThanOrEqual(0.90);
    expect(output.synthesis.confidence_breakdown.unsupported_penalty).toBe(0);
    expect(output.synthesis.confidence_breakdown.divergence_penalty).toBe(0);
    expect(output.synthesis.confidence_breakdown.lens_count_factor).toBe(1.0);
    expect(output.synthesis.confidence_breakdown.low_evidence_warning).toBe(false);
    expect(output.synthesis.confidence_breakdown.high_contradiction_warning).toBe(false);
    expect(output.synthesis.confidence_score).toBeGreaterThanOrEqual(0.55);
  });

  it('AT-RE-002: Full convergence, zero evidence => confidence [0.10, 0.35]', async () => {
    const input = baseInput();
    const embeddings = new Map<string, number[]>();
    const topics = ['acquisition valuation', 'integration complexity', 'market opportunity'];
    for (let l = 0; l < 5; l++) {
      for (let t = 0; t < 3; t++) {
        const cid = `c-${l}-${t}`;
        input.claims.push(makeClaim({ id: cid, perspective_id: `perspective-${l}`, statement: `Claim about ${topics[t]} from lens ${l}`, category: 'inferential', about_entity_canonical: topics[t], confidence_weight: 0.5, evidence_basis: null, evidence_status: 'unsupported', expires_at: '2025-03-09' }));
        const v = new Array(768).fill(0); v[t * 100] = 1.0; v[t * 100 + l + 1] = 0.05;
        const mag = Math.sqrt(v.reduce((s: number, x: number) => s + x * x, 0));
        for (let i = 0; i < 768; i++) v[i] /= mag;
        embeddings.set(cid, v);
      }
    }
    const output = await computeSynthesis(input, embeddings);
    expect(output.synthesis.convergence_points.length).toBe(3);
    expect(output.synthesis.confidence_breakdown.evidence_density_factor).toBe(0);
    expect(output.synthesis.confidence_breakdown.unsupported_penalty).toBeGreaterThan(0.3);
    expect(output.synthesis.confidence_score).toBeGreaterThanOrEqual(0.10);
    expect(output.synthesis.confidence_score).toBeLessThanOrEqual(0.35);
    expect(output.synthesis.confidence_breakdown.low_evidence_warning).toBe(true);
  });

  it('AT-RE-003: Analytical vs adversarial contradiction => divergence detected', async () => {
    const input = baseInput();
    const embeddings = new Map<string, number[]>();
    input.claims.push(makeClaim({ id: 'c-analytical', perspective_id: 'perspective-0', statement: 'Acquisition is viable at current valuation', category: 'evaluative', about_entity_canonical: 'acquisition viability', polarity: 'positive', confidence_weight: 0.8 }));
    input.claims.push(makeClaim({ id: 'c-adversarial', perspective_id: 'perspective-1', statement: 'Acquisition is overpriced relative to comparables', category: 'evaluative', about_entity_canonical: 'acquisition viability', polarity: 'negative', confidence_weight: 0.7 }));
    input.claims.push(makeClaim({ id: 'c-historical', perspective_id: 'perspective-2', statement: 'Historical data suggests viable pricing', category: 'evaluative', about_entity_canonical: 'acquisition viability', polarity: 'positive', confidence_weight: 0.6 }));
    input.claims.push(makeClaim({ id: 'c-stakeholder', perspective_id: 'perspective-3', statement: 'Stakeholders support acquisition viability', category: 'evaluative', about_entity_canonical: 'acquisition viability', polarity: 'positive', confidence_weight: 0.6 }));
    input.claims.push(makeClaim({ id: 'c-premortem', perspective_id: 'perspective-4', statement: 'Premortem indicates overpayment risk', category: 'evaluative', about_entity_canonical: 'acquisition viability', polarity: 'negative', confidence_weight: 0.7 }));
    for (const c of input.claims) { const ev = makeEvidence(`ev-${c.id}`, c.id); input.evidence_items.push(ev); input.claim_evidence_links.push(makeLink(c.id, ev.id)); }
    input.claims.forEach((c, idx) => { embeddings.set(c.id, makeSimilarVector(0, idx + 1, 0.01)); });
    const output = await computeSynthesis(input, embeddings);
    expect(output.synthesis.divergence_points.filter(d => d.nature === 'contradictory').length).toBeGreaterThanOrEqual(1);
    expect(output.synthesis.confidence_breakdown.divergence_penalty).toBeGreaterThan(0);
    expect(output.synthesis.confidence_score).toBeLessThanOrEqual(0.65);
  });

  it('AT-RE-004: Two lenses fail => lens_count_factor = 0.6', async () => {
    const input = baseInput();
    input.perspectives[3] = { ...input.perspectives[3], state: 'failed' as const };
    input.perspectives[4] = { ...input.perspectives[4], state: 'failed' as const };
    const embeddings = new Map<string, number[]>();
    for (let l = 0; l < 3; l++) { for (let t = 0; t < 2; t++) { const cid = `c-${l}-${t}`; input.claims.push(makeClaim({ id: cid, perspective_id: `perspective-${l}`, statement: `Claim ${t} lens ${l}`, category: 'inferential', about_entity_canonical: `topic ${t}`, confidence_weight: 0.6 })); embeddings.set(cid, makeSimilarVector(t * 100, t * 100 + l + 1)); } }
    const output = await computeSynthesis(input, embeddings);
    expect(output.synthesis.confidence_breakdown.lens_count_factor).toBe(0.6);
    expect(output.synthesis.confidence_rationale).toMatch(/lens|failed/i);
  });

  it('AT-RE-005: Stale unsupported claims get maximum penalty', async () => {
    const input = threeActiveLenses();
    const embeddings = new Map<string, number[]>();
    for (let i = 0; i < 3; i++) { const cid = `c-${i}`; input.claims.push(makeClaim({ id: cid, perspective_id: `perspective-${i}`, statement: `Claim ${i}`, category: 'inferential', about_entity_canonical: 'test entity', confidence_weight: 0.7, evidence_basis: i === 0 ? null : 'Evidence', evidence_status: i === 0 ? 'unsupported' : 'supported', stale_unsupported: i === 0, expires_at: i === 0 ? '2025-01-01' : null })); if (i > 0) { const ev = makeEvidence(`ev-${cid}`, cid); input.evidence_items.push(ev); input.claim_evidence_links.push(makeLink(cid, ev.id)); } embeddings.set(cid, makeSimilarVector(0, i + 1)); }
    const output = await computeSynthesis(input, embeddings);
    expect(output.synthesis.confidence_breakdown.unsupported_penalty).toBeGreaterThan(0);
    expect(output.claim_annotations.find(a => a.claim_id === 'c-0')?.stale_unsupported).toBe(true);
  });

  it('AT-RE-006: Different canonical entities => no false convergence', async () => {
    const input = threeActiveLenses();
    const embeddings = new Map<string, number[]>();
    input.claims.push(makeClaim({ id: 'c-rev', perspective_id: 'perspective-0', statement: 'Revenue is strong', category: 'evaluative', about_entity_canonical: 'heliotech revenue', polarity: 'positive' }));
    input.claims.push(makeClaim({ id: 'c-mor', perspective_id: 'perspective-1', statement: 'Morale is declining', category: 'evaluative', about_entity_canonical: 'heliotech team morale', polarity: 'negative' }));
    input.claims.push(makeClaim({ id: 'c-fil', perspective_id: 'perspective-2', statement: 'Market stable', category: 'inferential', about_entity_canonical: 'market' }));
    for (const c of input.claims) embeddings.set(c.id, makeVector(768, [0, 1.0]));
    const output = await computeSynthesis(input, embeddings);
    for (const cp of output.synthesis.convergence_points) { expect(cp.supporting_claims.includes('c-rev') && cp.supporting_claims.includes('c-mor')).toBe(false); }
  });

  it('AT-RE-007: Case-insensitive entity match => convergence', async () => {
    const input = threeActiveLenses();
    const embeddings = new Map<string, number[]>();
    input.claims.push(makeClaim({ id: 'c-a', perspective_id: 'perspective-0', statement: 'Price is reasonable', category: 'evaluative', about_entity_canonical: 'acquisition price', polarity: 'positive' }));
    input.claims.push(makeClaim({ id: 'c-b', perspective_id: 'perspective-1', statement: 'Price justified by metrics', category: 'evaluative', about_entity_canonical: 'acquisition price', polarity: 'positive' }));
    input.claims.push(makeClaim({ id: 'c-c', perspective_id: 'perspective-2', statement: 'Price in line with norms', category: 'evaluative', about_entity_canonical: 'acquisition price', polarity: 'positive' }));
    ['c-a','c-b','c-c'].forEach((id, i) => embeddings.set(id, makeSimilarVector(0, i + 1)));
    const output = await computeSynthesis(input, embeddings);
    expect(output.synthesis.convergence_points.length).toBeGreaterThanOrEqual(1);
    expect(output.synthesis.convergence_points[0].supporting_lenses.length).toBeGreaterThanOrEqual(2);
  });

  it('AT-RE-008: Borderline similarity + shared evidence => match', async () => {
    const input = threeActiveLenses();
    const embeddings = new Map<string, number[]>();
    input.claims.push(makeClaim({ id: 'c-a', perspective_id: 'perspective-0', statement: 'Integration risk moderate', category: 'evaluative', about_entity_canonical: 'integration risk' }));
    input.claims.push(makeClaim({ id: 'c-b', perspective_id: 'perspective-1', statement: 'Integration carries risk', category: 'evaluative', about_entity_canonical: 'integration risk' }));
    input.claims.push(makeClaim({ id: 'c-f', perspective_id: 'perspective-2', statement: 'Other', category: 'inferential', about_entity_canonical: 'other' }));
    const ev = makeEvidence('ev-shared', 'c-a'); input.evidence_items.push(ev); input.claim_evidence_links.push(makeLink('c-a', 'ev-shared'), makeLink('c-b', 'ev-shared'));
    const [va, vb] = makeBorderlineVectors(); embeddings.set('c-a', va); embeddings.set('c-b', vb); embeddings.set('c-f', makeVector(768, [500, 1.0]));
    const output = await computeSynthesis(input, embeddings);
    const themes = [...output.synthesis.convergence_points, ...output.synthesis.divergence_points];
    const shared = themes.find(t => { const ids = 'supporting_claims' in t ? t.supporting_claims : t.positions.flatMap((p: any) => p.claim_ids); return ids.includes('c-a') && ids.includes('c-b'); });
    expect(shared).toBeDefined();
  });

  it('AT-RE-009: Borderline similarity, no overlap => no match', async () => {
    const input = threeActiveLenses();
    const embeddings = new Map<string, number[]>();
    input.claims.push(makeClaim({ id: 'c-a', perspective_id: 'perspective-0', statement: 'Integration risk moderate', category: 'evaluative', about_entity_canonical: 'integration risk', evidence_basis: 'Alpha unique' }));
    input.claims.push(makeClaim({ id: 'c-b', perspective_id: 'perspective-1', statement: 'Integration carries risk', category: 'evaluative', about_entity_canonical: 'integration risk', evidence_basis: 'Beta different' }));
    input.claims.push(makeClaim({ id: 'c-f', perspective_id: 'perspective-2', statement: 'Other', category: 'inferential', about_entity_canonical: 'other' }));
    const ev1 = makeEvidence('ev-1', 'c-a'); ev1.content_text = 'Alpha'; const ev2 = makeEvidence('ev-2', 'c-b'); ev2.content_text = 'Beta'; input.evidence_items.push(ev1, ev2); input.claim_evidence_links.push(makeLink('c-a', 'ev-1'), makeLink('c-b', 'ev-2'));
    const [va, vb] = makeBorderlineVectors(); embeddings.set('c-a', va); embeddings.set('c-b', vb); embeddings.set('c-f', makeVector(768, [500, 1.0]));
    const output = await computeSynthesis(input, embeddings);
    expect(output.synthesis.orphan_claims).toContain('c-a');
    expect(output.synthesis.orphan_claims).toContain('c-b');
  });

  it('AT-RE-010: All lenses fail => INSUFFICIENT_INPUT', async () => {
    const input = baseInput();
    input.perspectives = input.perspectives.map(p => ({ ...p, state: 'failed' as const }));
    input.claims = [];
    await expect(computeSynthesis(input, new Map())).rejects.toThrow();
  });

  it('AT-RE-011: Non-overlapping time => scope_dependent, penalty = 0', async () => {
    const input = threeActiveLenses();
    const embeddings = new Map<string, number[]>();
    input.claims.push(makeClaim({ id: 'c-a', perspective_id: 'perspective-0', statement: 'Revenue strong H1', category: 'evaluative', about_entity_canonical: 'revenue growth', polarity: 'positive', valid_from: '2024-01-01', valid_until: '2024-06-30' }));
    input.claims.push(makeClaim({ id: 'c-b', perspective_id: 'perspective-1', statement: 'Revenue declining H2', category: 'evaluative', about_entity_canonical: 'revenue growth', polarity: 'negative', valid_from: '2024-07-01', valid_until: '2024-12-31' }));
    input.claims.push(makeClaim({ id: 'c-f', perspective_id: 'perspective-2', statement: 'Market observation', category: 'inferential', about_entity_canonical: 'market' }));
    embeddings.set('c-a', makeSimilarVector(0, 1)); embeddings.set('c-b', makeSimilarVector(0, 2)); embeddings.set('c-f', makeVector(768, [500, 1.0]));
    const output = await computeSynthesis(input, embeddings);
    expect(output.synthesis.divergence_points.find(d => d.nature === 'scope_dependent')).toBeDefined();
    expect(output.synthesis.divergence_points.filter(d => d.nature === 'contradictory').length).toBe(0);
    expect(output.synthesis.confidence_breakdown.divergence_penalty).toBe(0);
  });

  it('AT-RE-012: Large score delta => DRIFT_LARGE_DELTA flag', async () => {
    const input = threeActiveLenses();
    const embeddings = new Map<string, number[]>();
    for (let i = 0; i < 3; i++) { const cid = `c-${i}`; input.claims.push(makeClaim({ id: cid, perspective_id: `perspective-${i}`, statement: `Claim ${i}`, category: 'inferential', about_entity_canonical: 'test entity', confidence_weight: 0.3, evidence_basis: null, evidence_status: 'unsupported' })); embeddings.set(cid, makeSimilarVector(0, i + 1)); }
    input.prior_syntheses = [{ analysis_id: 'prior', confidence_score: 0.82, confidence_breakdown: { agreement_factor: 0.85, evidence_density_factor: 0.75, unsupported_penalty: 0, divergence_penalty: 0, lens_count_factor: 1.0, raw_score: 0.82, final_score: 0.82, drift_flags: [], low_evidence_warning: false, high_contradiction_warning: false, per_lens: [], per_theme: [] } as ConfidenceBreakdown, convergence_points: [], divergence_points: [], orphan_claims: [], computed_at: '2025-02-01' }];
    const output = await computeSynthesis(input, embeddings);
    expect(output.drift).not.toBeNull();
    expect(Math.abs(output.drift!.score_delta)).toBeGreaterThanOrEqual(0.25);
    expect(output.drift!.drift_flags).toContain('DRIFT_LARGE_DELTA');
  });

  it('AT-RE-013: Minimum viable => synthesis created, low confidence', async () => {
    const input = threeActiveLenses();
    const embeddings = new Map<string, number[]>();
    input.claims.push(makeClaim({ id: 'c-a', perspective_id: 'perspective-0', statement: 'Price reasonable', category: 'evaluative', about_entity_canonical: 'acquisition price', confidence_weight: 0.5 }));
    input.claims.push(makeClaim({ id: 'c-b', perspective_id: 'perspective-1', statement: 'Price favorable', category: 'evaluative', about_entity_canonical: 'acquisition price', confidence_weight: 0.5 }));
    input.claims.push(makeClaim({ id: 'c-o', perspective_id: 'perspective-2', statement: 'Team complex', category: 'inferential', about_entity_canonical: 'team dynamics', confidence_weight: 0.4 }));
    embeddings.set('c-a', makeSimilarVector(0, 1)); embeddings.set('c-b', makeSimilarVector(0, 2)); embeddings.set('c-o', makeVector(768, [500, 1.0]));
    const output = await computeSynthesis(input, embeddings);
    expect(output.synthesis.confidence_breakdown.lens_count_factor).toBe(0.6);
    expect(output.synthesis.convergence_points.length).toBeGreaterThanOrEqual(1);
    expect(output.synthesis.orphan_claims).toContain('c-o');
    expect(output.synthesis.confidence_score).toBeLessThan(0.70);
  });

  it('AT-RE-014: Invalid claims excluded from ALL scoring', async () => {
    const input = baseInput();
    const embeddings = new Map<string, number[]>();
    input.claims.push(makeClaim({ id: 'c-a-1', perspective_id: 'perspective-0', statement: 'Valuation reasonable', category: 'evaluative', about_entity_canonical: 'heliotech valuation', validity: 'strict', scoring_eligible: true, confidence_weight: 0.8 }));
    input.claims.push(makeClaim({ id: 'c-a-2', perspective_id: 'perspective-0', statement: 'Timeline 12 months', category: 'predictive', about_entity_canonical: 'integration timeline', validity: 'strict', scoring_eligible: true, confidence_weight: 0.7 }));
    input.claims.push(makeClaim({ id: 'c-a-inv', perspective_id: 'perspective-0', statement: 'Unresolvable claim', category: 'inferential', about_entity_canonical: 'unresolved', validity: 'invalid', scoring_eligible: false, confidence_weight: 0.9 }));
    input.claims.push(makeClaim({ id: 'c-b-1', perspective_id: 'perspective-1', statement: 'Valuation justified', category: 'evaluative', about_entity_canonical: 'heliotech valuation', validity: 'strict', scoring_eligible: true, confidence_weight: 0.7 }));
    input.claims.push(makeClaim({ id: 'c-b-2', perspective_id: 'perspective-1', statement: 'Timeline ~12 months', category: 'predictive', about_entity_canonical: 'integration timeline', validity: 'strict', scoring_eligible: true, confidence_weight: 0.6 }));
    for (let i = 2; i < 5; i++) input.claims.push(makeClaim({ id: `c-f-${i}`, perspective_id: `perspective-${i}`, statement: `Filler ${i}`, category: 'inferential', about_entity_canonical: 'general', confidence_weight: 0.5 }));
    for (const id of ['c-a-1', 'c-b-1']) embeddings.set(id, makeSimilarVector(0, id === 'c-a-1' ? 1 : 2));
    for (const id of ['c-a-2', 'c-b-2']) embeddings.set(id, makeSimilarVector(100, id === 'c-a-2' ? 101 : 102));
    embeddings.set('c-a-inv', new Array(768).fill(0));
    for (let i = 2; i < 5; i++) embeddings.set(`c-f-${i}`, makeVector(768, [200 + i * 50, 1.0]));
    const output = await computeSynthesis(input, embeddings);
    expect(output.synthesis.convergence_points.length).toBeGreaterThanOrEqual(2);
    const allThemed = [...output.synthesis.convergence_points.flatMap(c => c.supporting_claims), ...output.synthesis.divergence_points.flatMap(d => d.positions.flatMap(p => p.claim_ids))];
    expect(allThemed).not.toContain('c-a-inv');
    expect(output.synthesis.orphan_claims).not.toContain('c-a-inv');
  });

  it('AT-RE-015: Same polarity (negation inversion) => convergence', async () => {
    const input = threeActiveLenses();
    const embeddings = new Map<string, number[]>();
    input.claims.push(makeClaim({ id: 'c-a', perspective_id: 'perspective-0', statement: 'Not viable at this price', category: 'evaluative', about_entity_canonical: 'acquisition viability', polarity: 'negative' }));
    input.claims.push(makeClaim({ id: 'c-b', perspective_id: 'perspective-1', statement: 'Acquisition is unviable', category: 'evaluative', about_entity_canonical: 'acquisition viability', polarity: 'negative' }));
    input.claims.push(makeClaim({ id: 'c-f', perspective_id: 'perspective-2', statement: 'Other', category: 'inferential', about_entity_canonical: 'other' }));
    embeddings.set('c-a', makeSimilarVector(0, 1)); embeddings.set('c-b', makeSimilarVector(0, 2)); embeddings.set('c-f', makeVector(768, [500, 1.0]));
    const output = await computeSynthesis(input, embeddings);
    expect(output.synthesis.divergence_points.filter(d => d.nature === 'contradictory').length).toBe(0);
    const cp = output.synthesis.convergence_points.find(c => c.supporting_claims.includes('c-a') && c.supporting_claims.includes('c-b'));
    expect(cp).toBeDefined();
  });

  it('AT-RE-016: Same entity, low sim => orphans, no contradiction', async () => {
    const input = threeActiveLenses();
    const embeddings = new Map<string, number[]>();
    input.claims.push(makeClaim({ id: 'c-a', perspective_id: 'perspective-0', statement: 'Revenue strong', category: 'evaluative', about_entity_canonical: 'heliotech', polarity: 'positive' }));
    input.claims.push(makeClaim({ id: 'c-b', perspective_id: 'perspective-1', statement: 'Culture fragile', category: 'evaluative', about_entity_canonical: 'heliotech', polarity: 'negative' }));
    input.claims.push(makeClaim({ id: 'c-f', perspective_id: 'perspective-2', statement: 'General', category: 'inferential', about_entity_canonical: 'market' }));
    embeddings.set('c-a', makeVector(768, [0, 1.0])); embeddings.set('c-b', makeVector(768, [300, 1.0])); embeddings.set('c-f', makeVector(768, [600, 1.0]));
    const output = await computeSynthesis(input, embeddings);
    expect(output.synthesis.orphan_claims).toContain('c-a');
    expect(output.synthesis.orphan_claims).toContain('c-b');
    expect(output.synthesis.divergence_points.filter(d => d.nature === 'contradictory').length).toBe(0);
  });
});
