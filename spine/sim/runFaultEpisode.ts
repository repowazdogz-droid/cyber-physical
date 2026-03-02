// spine/sim/runFaultEpisode.ts

import { makeRng, randn } from "./rng";
import type { FaultEpisodeSim, Vec3 } from "./FaultEpisodeTypes";
import { applyGnssBiasDrift, wrongConfidence } from "../faults/fault_models";

function vAdd(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}
function vSub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}
function vScale(a: Vec3, s: number): Vec3 {
  return { x: a.x * s, y: a.y * s, z: a.z * s };
}
function vMag(a: Vec3): number {
  return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
}
function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export async function runEpisode(def: {
  episodeId: string;
  scenario: string;
  seed: number;
  dt: number;
  steps: number;
  referenceAt: (t: number) => Vec3;
  gnssFault: () => { startStep: number; driftPerStep: Vec3 };
  envelope: { maxPosError: number };
}): Promise<FaultEpisodeSim> {
  const rand = makeRng(def.seed);
  const dt = def.dt;
  const steps = def.steps;

  // Truth state
  let pos: Vec3 = { x: 0, y: 0, z: 0 };
  let vel: Vec3 = { x: 0, y: 0, z: 0 };

  // Estimator state (naive: trusts GNSS heavily)
  let posEst: Vec3 = { x: 0, y: 0, z: 0 };

  const tArr: number[] = [];
  const truthArr: any[] = [];
  const sensorsArr: any[] = [];
  const estArr: any[] = [];
  const ctrlArr: any[] = [];
  const events: any[] = [];

  const fault = def.gnssFault();
  let breachIndex = -1;

  // Controller gains
  const kp = 0.9;
  const kd = 0.25;

  for (let i = 0; i < steps; i++) {
    const t = i * dt;
    tArr.push(t);

    // Reference
    const ref = def.referenceAt(t);

    // Controller (PD on estimated state)
    const posErr = vSub(ref, posEst);
    const velErr = vSub({ x: 0, y: 0, z: 0 }, vel);
    const accelCmd = vAdd(vScale(posErr, kp), vScale(velErr, kd));

    // Clamp accel to keep it mild
    const a = {
      x: clamp(accelCmd.x, -2, 2),
      y: clamp(accelCmd.y, -2, 2),
      z: 0,
    };

    // Truth integration
    vel = vAdd(vel, vScale(a, dt));
    pos = vAdd(pos, vScale(vel, dt));

    // Sensors: GNSS position (truth + noise + bias drift)
    const noise = {
      x: randn(rand) * 0.15,
      y: randn(rand) * 0.15,
      z: 0,
    };
    const gnssPos = applyGnssBiasDrift(i, pos, noise, fault);

    // Estimator: naive blend (overtrust GNSS)
    // posEst = 0.85*gnss + 0.15*posEst (should be more cautious)
    posEst = vAdd(vScale(gnssPos, 0.85), vScale(posEst, 0.15));
    const confidence = wrongConfidence(i, fault.startStep);

    // Record
    truthArr.push({ pos, vel });
    sensorsArr.push({ gnssPos });
    estArr.push({ posEst, confidence });
    ctrlArr.push({ accelCmd: a });

    // Events
    if (i === fault.startStep) {
      events.push({
        t,
        kind: "FAULT_INJECTED",
        detail: "GNSS bias drift begins; estimator confidence remains high (mismatch).",
      });
    }

    if (breachIndex < 0) {
      const estError = vMag(vSub(posEst, pos));
      if (estError > def.envelope.maxPosError) {
        breachIndex = i;
        events.push({
          t,
          kind: "ENVELOPE_BREACH",
          detail: `Position estimation error exceeded ${def.envelope.maxPosError.toFixed(
            1
          )}m.`,
        });
      }
    }
  }

  if (breachIndex < 0) breachIndex = steps - 1;

  return {
    meta: {
      episodeId: def.episodeId,
      scenario: def.scenario,
      seed: def.seed,
      dt: def.dt,
      steps: def.steps,
      createdAtIso: new Date().toISOString(),
    },
    t: tArr,
    truth: truthArr,
    sensors: sensorsArr,
    estimator: estArr,
    controller: ctrlArr,
    events,
    breachIndex,
  };
}



































