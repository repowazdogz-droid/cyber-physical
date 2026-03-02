import type { OrientationState } from "../types/orientation";

export const defaultOrientationState: OrientationState = {
  title: "Orientation Lab",
  context:
    "Capture structure under uncertainty. No answers—just what's being assumed, disputed, and unknown.",
  models: [],
  assumptions: [],
  disagreements: [],
  unknowns: [],
  judgments: [],
  updatedAt: Date.now(),
};

