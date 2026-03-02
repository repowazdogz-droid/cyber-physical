// spine/faults/fault_models.ts

import type { Vec3 } from "../sim/FaultEpisodeTypes";

export type GnssBiasDrift = {
  startStep: number;
  driftPerStep: Vec3; // meters per step
};

export function applyGnssBiasDrift(
  step: number,
  truthPos: Vec3,
  noise: Vec3,
  fault: GnssBiasDrift
): Vec3 {
  let bias = { x: 0, y: 0, z: 0 };
  if (step >= fault.startStep) {
    const k = step - fault.startStep;
    bias = {
      x: fault.driftPerStep.x * k,
      y: fault.driftPerStep.y * k,
      z: fault.driftPerStep.z * k,
    };
  }
  return {
    x: truthPos.x + noise.x + bias.x,
    y: truthPos.y + noise.y + bias.y,
    z: truthPos.z + noise.z + bias.z,
  };
}

export function wrongConfidence(step: number, startStep: number): number {
  // Faulty confidence: stays high even after fault starts
  if (step < startStep) return 0.92;
  return 0.90; // should drop, but doesn't
}



































