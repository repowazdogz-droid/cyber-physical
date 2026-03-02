import { describe, it, expect } from "vitest";
import {
  priorityScore,
  ratioCapAllowsProbe,
  timeFloorAllowsProbe,
  canScheduleProbe,
} from "./scheduler";

describe("scheduler", () => {
  it("computes higher priority for active state and low confidence", () => {
    const low = priorityScore({
      severityWeight: 1,
      confidenceScore: 0.3,
      state: "ACTIVE",
      minutesSinceLastProbe: 10,
      downstreamDependencyWeight: 0.5,
    });
    const high = priorityScore({
      severityWeight: 1,
      confidenceScore: 0.9,
      state: "EMERGING",
      minutesSinceLastProbe: 10,
      downstreamDependencyWeight: 0.5,
    });
    expect(low).toBeGreaterThan(high);
  });

  it("ratio cap: allows probe when under 1 per 3 interactions", () => {
    expect(ratioCapAllowsProbe(3, 0, { probeRatioCap: 0.33 })).toBe(true);
    expect(ratioCapAllowsProbe(6, 1, { probeRatioCap: 0.33 })).toBe(true);
    expect(ratioCapAllowsProbe(3, 1, { probeRatioCap: 0.33 })).toBe(false);
  });

  it("time floor: allows probe when no previous or after min minutes", () => {
    expect(timeFloorAllowsProbe(null, { minMinutesBetween: 2 })).toBe(true);
    expect(timeFloorAllowsProbe(1, { minMinutesBetween: 2 })).toBe(false);
    expect(timeFloorAllowsProbe(2, { minMinutesBetween: 2 })).toBe(true);
  });

  it("canScheduleProbe enforces both ratio cap and time floor", () => {
    expect(canScheduleProbe(3, 0, null)).toBe(true);
    expect(canScheduleProbe(3, 1, null)).toBe(false);
    expect(canScheduleProbe(3, 0, 1)).toBe(false);
  });
});
