import type { Universe, StateId } from "./types";
import { compileUniverseToCnf } from "./cnf";
import { solveCnfWithAssumptions } from "./satLogicSolver";

export type SampleStats = {
  samples: number;
  t: number;
  p: Record<StateId, number>;
  entropyBits: number;
};

export type BoltzmannStats = {
  samples: number;   // accepted samples used in estimate
  tries: number;     // SAT attempts
  t: number;
  T: number;         // temperature
  wMissing: number;
  wExtra: number;
  target: StateId[];
  p: Record<StateId, number>;
  entropyBits: number;
  avgEnergy: number;
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function entropyBitsFromP(ps: number[]) {
  // Shannon entropy in bits: -Σ p log2 p, using Bernoulli per-state entropy summed (independent approx).
  // This is not the full joint entropy, but it is a great "phase collapse" indicator.
  let h = 0;
  for (const p of ps) {
    const q = 1 - p;
    if (p > 0) h += -p * Math.log2(p);
    if (q > 0) h += -q * Math.log2(q);
  }
  return h;
}

export async function estimateProbabilities(
  u: Universe,
  t: number,
  nSamples: number,
  maxTries: number
): Promise<SampleStats> {
  const comp = compileUniverseToCnf(u);

  const counts: Record<string, number> = {};
  for (const s of u.states) counts[s] = 0;

  let got = 0;
  let tries = 0;

  // Diversification trick:
  // Add a few random unit "preferences" (not hard constraints) by trying both polarities:
  // We attempt a SAT solve with random unit clauses; if UNSAT, retry. If SAT, accept model.
  // This produces decent variety for interactive purposes.
  const rng = (() => {
    let x = 0x9e3779b9 ^ (Date.now() & 0xffffffff);
    return () => {
      x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
      return (x >>> 0) / 4294967296;
    };
  })();

  while (got < nSamples && tries < maxTries) {
    tries++;

    const randUnits: number[] = [];
    // number of random units: scale with N (cap to keep it fast)
    const k = Math.min(6, Math.max(2, Math.floor(u.states.length / 3)));
    for (let i = 0; i < k; i++) {
      const s = u.states[Math.floor(rng() * u.states.length)]!;
      const v = comp.varOfStateAt(s, t);
      randUnits.push(rng() < 0.5 ? v : -v);
    }

    const res = solveCnfWithAssumptions(
      comp.clauses,
      [...comp.enableAllAssumptions, ...randUnits]
    );

    if (res.status !== "SAT") continue;

    got++;
    // Count truth of each S@t in this model
    for (const s of u.states) {
      const v = comp.varOfStateAt(s, t);
      if (res.model.has(v)) counts[s] += 1;
    }

    // Yield occasionally so UI stays responsive
    if (got % 10 === 0) await new Promise(r => setTimeout(r, 0));
  }

  const p: Record<StateId, number> = {} as any;
  for (const s of u.states) p[s] = got === 0 ? 0 : clamp01(counts[s] / got);

  const entropyBits = entropyBitsFromP(u.states.map(s => p[s]));

  return { samples: got, t, p, entropyBits };
}

function parseTarget(states: StateId[], target: StateId[]) {
  const set = new Set<StateId>(target);
  // Filter to valid states
  const valid = target.filter(s => states.includes(s));
  return new Set<StateId>(valid);
}

function energyAtT(states: StateId[], targetSet: Set<StateId>, worldAtT: Set<StateId>, wMissing: number, wExtra: number) {
  // Energy: weighted symmetric difference relative to target
  // missing: in target but not in world => +wMissing
  // extra: in world but not in target => +wExtra
  let e = 0;
  for (const s of targetSet) if (!worldAtT.has(s)) e += wMissing;
  for (const s of worldAtT) if (!targetSet.has(s)) e += wExtra;
  return e;
}

function safeExpNeg(x: number) {
  // avoid underflow explosions; exp(-x) for x up to ~700 is safe in JS doubles
  if (x > 700) return 0;
  return Math.exp(-x);
}

export async function estimateBoltzmannProbabilities(
  u: Universe,
  t: number,
  nSamples: number,
  maxTries: number,
  temperature: number,
  target: StateId[],
  wMissing: number,
  wExtra: number
): Promise<BoltzmannStats> {
  const comp = compileUniverseToCnf(u);

  const T = Math.max(0.0001, temperature); // prevent divide-by-zero
  const wM = Math.max(1, Math.floor(wMissing));
  const wE = Math.max(1, Math.floor(wExtra));

  const targetSet = parseTarget(u.states, target);

  const weightedCounts: Record<string, number> = {};
  for (const s of u.states) weightedCounts[s] = 0;

  let weightSum = 0;
  let energySum = 0;

  let got = 0;
  let tries = 0;

  // Same diversification RNG
  const rng = (() => {
    let x = 0x9e3779b9 ^ (Date.now() & 0xffffffff);
    return () => {
      x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
      return (x >>> 0) / 4294967296;
    };
  })();

  while (got < nSamples && tries < maxTries) {
    tries++;

    const randUnits: number[] = [];
    const k = Math.min(6, Math.max(2, Math.floor(u.states.length / 3)));
    for (let i = 0; i < k; i++) {
      const s = u.states[Math.floor(rng() * u.states.length)]!;
      const v = comp.varOfStateAt(s, t);
      randUnits.push(rng() < 0.5 ? v : -v);
    }

    const res = solveCnfWithAssumptions(comp.clauses, [...comp.enableAllAssumptions, ...randUnits]);
    if (res.status !== "SAT") continue;

    // Extract world@t
    const worldAtT = new Set<StateId>();
    for (const s of u.states) {
      const v = comp.varOfStateAt(s, t);
      if (res.model.has(v)) worldAtT.add(s);
    }

    const E = energyAtT(u.states, targetSet, worldAtT, wM, wE);
    const w = safeExpNeg(E / T);

    // If w is extremely small, it contributes almost nothing; still counts as a sample
    got++;
    weightSum += w;
    energySum += E * w;

    for (const s of u.states) {
      if (worldAtT.has(s)) weightedCounts[s] += w;
    }

    if (got % 10 === 0) await new Promise(r => setTimeout(r, 0));
  }

  const p: Record<StateId, number> = {} as any;
  for (const s of u.states) {
    p[s] = weightSum === 0 ? 0 : clamp01(weightedCounts[s] / weightSum);
  }

  const entropyBits = entropyBitsFromP(u.states.map(s => p[s]));
  const avgEnergy = weightSum === 0 ? 0 : (energySum / weightSum);

  return {
    samples: got,
    tries,
    t,
    T,
    wMissing: wM,
    wExtra: wE,
    target: Array.from(targetSet),
    p,
    entropyBits,
    avgEnergy,
  };
}

