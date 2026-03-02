/**
 * UAV Demo Presets
 * 
 * Curated presets for Safe Landing Decision Square kernel.
 * Deterministic inputs for talk demos.
 * 
 * Version: 0.1
 */

export interface UAVPreset {
  id: string;
  title: string;
  whatHappening: string; // One line description
  input: {
    altitude: number;
    healthStatus: string;
    environment: string;
    timeToContact: number;
  };
}

export const UAV_PRESETS: UAVPreset[] = [
  {
    id: 'preset_1',
    title: 'Near-Nominal Flight',
    whatHappening: 'Good altitude, healthy systems, clear environment, adequate time',
    input: {
      altitude: 75, // A1 (> 50m)
      healthStatus: 'H1', // Nominal
      environment: 'E1', // Clear
      timeToContact: 35 // T4 (> 30s)
    }
  },
  {
    id: 'preset_2',
    title: 'Estimation Ambiguity',
    whatHappening: 'Critical health (H3) even with good altitude - bias to harder outcome',
    input: {
      altitude: 60, // A1 (> 50m)
      healthStatus: 'H3', // Critical
      environment: 'E1', // Clear
      timeToContact: 20 // T3 (15-30s)
    }
  },
  {
    id: 'preset_3',
    title: 'Obstructed Environment',
    whatHappening: 'Weather/obstacles (E3) force landing even if authority is good',
    input: {
      altitude: 40, // A2 (20-50m)
      healthStatus: 'H1', // Nominal
      environment: 'E3', // Weather
      timeToContact: 18 // T3 (15-30s)
    }
  },
  {
    id: 'preset_4',
    title: 'Immediate Time to Contact',
    whatHappening: 'TTC immediate (T1) forces emergency landing regardless of other factors',
    input: {
      altitude: 30, // A2 (20-50m)
      healthStatus: 'H2', // Degraded
      environment: 'E1', // Clear
      timeToContact: 3 // T1 (< 5s)
    }
  },
  {
    id: 'preset_5',
    title: 'Composite Fault',
    whatHappening: 'Oscillating altitude (A2/A3) treated as A3 - worst credible dominates',
    input: {
      altitude: 15, // A3 (10-20m) - treated as worst credible
      healthStatus: 'H2', // Degraded
      environment: 'E2', // Obstacles
      timeToContact: 12 // T2 (5-15s)
    }
  }
];

/**
 * Gets a preset by ID.
 */
export function getPreset(presetId: string): UAVPreset | undefined {
  return UAV_PRESETS.find(p => p.id === presetId);
}

