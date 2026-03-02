// spine/sim/episodes/episode_001.ts

import type { Vec3 } from "../FaultEpisodeTypes";
import type { GnssBiasDrift } from "../../faults/fault_models";

export const EPISODE_001 = {
  episodeId: "episode_001",
  scenario: "Nominal hover → lateral translate → land (2D simplified)",
  seed: 1337,
  dt: 0.1,
  steps: 400, // 40s
  // Reference trajectory: hover then move in +x, then descend slightly
  referenceAt(t: number): Vec3 {
    // Keep it simple: z constant at 0 for this sim; we track x,y only
    // 0-10s hover at (0,0)
    // 10-25s move to x=20m
    // 25-40s hold
    if (t < 10) return { x: 0, y: 0, z: 0 };
    if (t < 25) {
      const u = (t - 10) / 15;
      return { x: 20 * u, y: 0, z: 0 };
    }
    return { x: 20, y: 0, z: 0 };
  },
  // Fault starts mid-translate
  gnssFault(): GnssBiasDrift {
    return {
      startStep: 170, // t=17s
      driftPerStep: { x: 0.015, y: 0.0, z: 0.0 }, // accumulates to ~3.5m by end
    };
  },
  envelope: {
    maxPosError: 2.0, // meters; breach when |posEst - truth| exceeds this
  },
};



































