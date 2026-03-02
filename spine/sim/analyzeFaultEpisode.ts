// spine/sim/analyzeFaultEpisode.ts

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

type Vec3 = { x: number; y: number; z: number };

type SimEvent = {
  t: number;
  type: string; // "FAULT_INJECTED" | "ENVELOPE_BREACH" | ...
  message?: string;
  data?: Record<string, unknown>;
};

type SimFrame = {
  pos: Vec3;
  vel: Vec3;
};

type SensorFrame = {
  gnssPos?: Vec3;
  // allow other sensors later
};

type EstimatorFrame = {
  pos?: Vec3;
  confidence?: number; // 0..1
};

export type FaultEpisodeSim = {
  meta: {
    episodeId: string;
    scenario: string;
    seed: number;
    dt: number;
    steps: number;
  };
  t: number[];
  truth: SimFrame[];
  sensors: SensorFrame[];
  estimator: EstimatorFrame[];
  controller?: unknown[];
  events: SimEvent[];
  breachIndex?: number;
};

function norm(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}
function sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function safeMean(xs: number[]): number | null {
  const finite = xs.filter((x) => Number.isFinite(x));
  if (finite.length === 0) return null;
  return finite.reduce((a, b) => a + b, 0) / finite.length;
}
function safeMax(xs: number[]): number | null {
  const finite = xs.filter((x) => Number.isFinite(x));
  if (finite.length === 0) return null;
  return Math.max(...finite);
}
function safeRms(xs: number[]): number | null {
  const finite = xs.filter((x) => Number.isFinite(x));
  if (finite.length === 0) return null;
  const m2 = finite.reduce((a, b) => a + b * b, 0) / finite.length;
  return Math.sqrt(m2);
}

function sha256Text(s: string): string {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

export type FaultEpisodeAnalysis = {
  episodeId: string;
  scenario: string;
  seed: number;
  dt: number;
  steps: number;

  faultInjected?: { t: number; index: number; message?: string };
  envelopeBreach?: { t: number; index: number; message?: string };

  // Errors
  positionError: {
    max: number | null;
    rms: number | null;
    atFault: number | null;
    atBreach: number | null;
  };

  // Confidence behavior (if present)
  confidence: {
    preFaultMean: number | null;
    postFaultMean: number | null;
    atFault: number | null;
    atBreach: number | null;
    mismatchFlag: boolean; // high confidence while error large
  };

  // Integrity
  simHash: string; // hash of sim.json content (for stable references)
};

export function loadSimFromEpisodeDir(episodeDir: string): FaultEpisodeSim {
  const simPath = path.join(episodeDir, "sim.json");
  const raw = fs.readFileSync(simPath, "utf8");
  return JSON.parse(raw) as FaultEpisodeSim;
}

export function analyzeFaultEpisode(sim: FaultEpisodeSim, simJsonRaw?: string): FaultEpisodeAnalysis {
  const episodeId = sim.meta?.episodeId ?? "unknown";
  const scenario = sim.meta?.scenario ?? "unknown";
  const seed = sim.meta?.seed ?? 0;
  const dt = sim.meta?.dt ?? 0.1;
  const steps = sim.meta?.steps ?? (sim.t?.length ?? 0);

  const faultEvent = sim.events.find((e) => e.type === "FAULT_INJECTED" || (e as any).kind === "FAULT_INJECTED");
  const breachEvent = sim.events.find((e) => e.type === "ENVELOPE_BREACH" || (e as any).kind === "ENVELOPE_BREACH");

  const faultIndex = faultEvent ? Math.max(0, Math.min(sim.t.length - 1, Math.round(faultEvent.t / dt))) : null;
  const breachIndex = typeof sim.breachIndex === "number" ? sim.breachIndex : null;

  // Position error: || estimator.pos - truth.pos ||
  const err: number[] = sim.t.map((_, i) => {
    const truthPos = sim.truth?.[i]?.pos;
    const estPos = sim.estimator?.[i]?.pos;
    if (!truthPos || !estPos) return NaN;
    return norm(sub(estPos, truthPos));
  });

  const maxErr = safeMax(err);
  const rmsErr = safeRms(err);

  const atFault = faultIndex == null ? null : (Number.isFinite(err[faultIndex]) ? err[faultIndex] : null);
  const atBreach = breachIndex == null ? null : (Number.isFinite(err[breachIndex]) ? err[breachIndex] : null);

  // Confidence metrics
  const conf: number[] = sim.t.map((_, i) => {
    const c = sim.estimator?.[i]?.confidence;
    return typeof c === "number" ? c : NaN;
  });

  const pre = faultIndex == null ? conf : conf.slice(0, faultIndex);
  const post = faultIndex == null ? conf : conf.slice(faultIndex);

  const preMean = safeMean(pre);
  const postMean = safeMean(post);

  const confAtFault = faultIndex == null ? null : (Number.isFinite(conf[faultIndex]) ? conf[faultIndex] : null);
  const confAtBreach = breachIndex == null ? null : (Number.isFinite(conf[breachIndex]) ? conf[breachIndex] : null);

  // Simple mismatch flag: confidence >= 0.8 while error >= 2.0m at any point post-fault
  let mismatchFlag = false;
  for (let i = 0; i < sim.t.length; i++) {
    const e = err[i];
    const c = conf[i];
    if (Number.isFinite(e) && Number.isFinite(c) && c >= 0.8 && e >= 2.0) {
      mismatchFlag = true;
      break;
    }
  }

  const simHash = simJsonRaw ? sha256Text(simJsonRaw) : sha256Text(JSON.stringify(sim));

  return {
    episodeId,
    scenario,
    seed,
    dt,
    steps,
    faultInjected: faultEvent
      ? { t: faultEvent.t, index: faultIndex ?? 0, message: faultEvent.message || (faultEvent as any).detail }
      : undefined,
    envelopeBreach: breachEvent
      ? { t: breachEvent.t, index: breachIndex ?? 0, message: breachEvent.message || (breachEvent as any).detail }
      : undefined,
    positionError: { max: maxErr, rms: rmsErr, atFault, atBreach },
    confidence: { preFaultMean: preMean, postFaultMean: postMean, atFault: confAtFault, atBreach: confAtBreach, mismatchFlag },
    simHash,
  };
}

export function renderFaultEpisodeReportMarkdown(a: FaultEpisodeAnalysis): string {
  const fmt = (n: number | null) => (n == null ? "—" : n.toFixed(3));
  const fmtT = (n?: number) => (typeof n === "number" ? `${n.toFixed(1)}s` : "—");

  // "Omega-style": Claims / Evidence / Unknowns (no advice, no conclusions-as-actions)
  const claims: string[] = [];
  const evidence: string[] = [];
  const unknowns: string[] = [];

  if (a.faultInjected) {
    claims.push(`A fault is injected at ${fmtT(a.faultInjected.t)} (index ${a.faultInjected.index}).`);
    evidence.push(`Event log contains FAULT_INJECTED at ${fmtT(a.faultInjected.t)}.`);
  } else {
    unknowns.push("No FAULT_INJECTED event was found in the event log.");
  }

  if (a.envelopeBreach) {
    claims.push(`The safety envelope is breached at ${fmtT(a.envelopeBreach.t)} (index ${a.envelopeBreach.index}).`);
    evidence.push(`Event log contains ENVELOPE_BREACH at ${fmtT(a.envelopeBreach.t)}.`);
  } else {
    unknowns.push("No ENVELOPE_BREACH event was found in the event log.");
  }

  if (a.positionError.max != null) {
    evidence.push(`Max position error observed: ${fmt(a.positionError.max)} m.`);
    evidence.push(`RMS position error observed: ${fmt(a.positionError.rms)} m.`);
  } else {
    unknowns.push("Position error could not be computed (missing estimator.pos or truth.pos).");
  }

  if (a.faultInjected && a.positionError.atFault != null) {
    evidence.push(`Position error at fault injection: ${fmt(a.positionError.atFault)} m.`);
  }
  if (a.envelopeBreach && a.positionError.atBreach != null) {
    evidence.push(`Position error at envelope breach: ${fmt(a.positionError.atBreach)} m.`);
  }

  if (a.confidence.preFaultMean != null || a.confidence.postFaultMean != null) {
    claims.push("Estimator confidence is present and measurable.");
    evidence.push(`Mean confidence pre-fault: ${fmt(a.confidence.preFaultMean)}.`);
    evidence.push(`Mean confidence post-fault: ${fmt(a.confidence.postFaultMean)}.`);
    if (a.confidence.mismatchFlag) {
      claims.push("A confidence–error mismatch occurs (high confidence while error is large).");
      evidence.push("Mismatch flag triggered (confidence ≥ 0.8 while error ≥ 2.0 m).");
    }
  } else {
    unknowns.push("Estimator confidence is missing or non-numeric.");
  }

  const md = `# Fault Episode Report — ${a.episodeId}

**Scenario:** ${a.scenario}  
**Seed:** ${a.seed}  
**dt:** ${a.dt}s  
**Steps:** ${a.steps}  
**sim.json hash:** \`${a.simHash}\`

---

## Key Events

- **Fault injected:** ${a.faultInjected ? `${fmtT(a.faultInjected.t)} (index ${a.faultInjected.index})` : "—"}
- **Envelope breach:** ${a.envelopeBreach ? `${fmtT(a.envelopeBreach.t)} (index ${a.envelopeBreach.index})` : "—"}

---

## Error Summary

- **Max position error:** ${fmt(a.positionError.max)} m  
- **RMS position error:** ${fmt(a.positionError.rms)} m  
- **Error @ fault:** ${fmt(a.positionError.atFault)} m  
- **Error @ breach:** ${fmt(a.positionError.atBreach)} m  

---

## Confidence Summary

- **Mean confidence (pre-fault):** ${fmt(a.confidence.preFaultMean)}  
- **Mean confidence (post-fault):** ${fmt(a.confidence.postFaultMean)}  
- **Confidence @ fault:** ${fmt(a.confidence.atFault)}  
- **Confidence @ breach:** ${fmt(a.confidence.atBreach)}  
- **Confidence–error mismatch flagged:** ${a.confidence.mismatchFlag ? "YES" : "NO"}  

---

## Claims

${claims.length ? claims.map((c) => `- ${c}`).join("\n") : "- —"}

---

## Evidence

${evidence.length ? evidence.map((e) => `- ${e}`).join("\n") : "- —"}

---

## Unknowns

${unknowns.length ? unknowns.map((u) => `- ${u}`).join("\n") : "- —"}

---

_This report is deterministic and derived only from \`sim.json\`. It provides structure for human judgment._
`;

  return md;
}



































