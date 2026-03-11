/**
 * Scenario config definitions. JSON-compatible; behaviour matches legacy scenario builders.
 */

import type { ScenarioId } from '../../types/simulation'
import type { ScenarioConfig } from './scenarioConfig'

const SURVEILLANCE_ANCHORS = [
  { x: 120, y: 16, z: -10 },
  { x: 0, y: 16, z: -60 },
  { x: -90, y: 16, z: -30 },
  { x: 40, y: 14, z: -120 },
  { x: -40, y: 14, z: -120 },
]

export const ROUTINE_PATROL_CONFIG: ScenarioConfig = {
  id: 'routine_patrol',
  label: 'Routine Patrol',
  description: 'Standard perimeter, surveillance, and escort; no hostiles.',
  seed: 42,
  agentTemplates: [
    {
      role: 'PATROL',
      count: 30,
      seedOffset: 0,
      spawnRegion: { kind: 'circle', radius: 260, centerX: 0, centerZ: 0, y: 10 },
      waypointPattern: { kind: 'perimeter', numWaypoints: 4, radiusJitterMin: -30, radiusJitterMax: 30 },
    },
    {
      role: 'SURVEILLANCE',
      count: 10,
      seedOffset: 1000,
      spawnRegion: { kind: 'anchors', points: SURVEILLANCE_ANCHORS, jitterX: 12, jitterZ: 12 },
      waypointPattern: { kind: 'station', radius: 18 },
    },
    {
      role: 'ESCORT',
      count: 10,
      seedOffset: 2000,
      spawnRegion: {
        kind: 'line',
        startX: -140,
        startZ: -40,
        endX: 160,
        endZ: -40,
        y: 12,
      },
      waypointPattern: { kind: 'corridor', forwardOffset: 40, backOffset: 40 },
    },
  ],
}

export const THREAT_DETECTION_CONFIG: ScenarioConfig = {
  id: 'threat_detection',
  label: 'Threat Detection',
  description: 'Reduced patrol and escort; hostile ingress probe.',
  seed: 42,
  agentTemplates: [
    {
      role: 'PATROL',
      count: 24,
      seedOffset: 0,
      spawnRegion: { kind: 'circle', radius: 260, centerX: 0, centerZ: 0, y: 10 },
      waypointPattern: { kind: 'perimeter', numWaypoints: 4, radiusJitterMin: -30, radiusJitterMax: 30 },
    },
    {
      role: 'SURVEILLANCE',
      count: 10,
      seedOffset: 1000,
      spawnRegion: { kind: 'anchors', points: SURVEILLANCE_ANCHORS, jitterX: 12, jitterZ: 12 },
      waypointPattern: { kind: 'station', radius: 18 },
    },
    {
      role: 'ESCORT',
      count: 4,
      seedOffset: 2000,
      spawnRegion: {
        kind: 'line',
        startX: -140,
        startZ: -40,
        endX: 160,
        endZ: -40,
        y: 12,
      },
      waypointPattern: { kind: 'corridor', forwardOffset: 40, backOffset: 40 },
    },
  ],
  hostileTemplates: [
    {
      role: 'HOSTILE',
      count: 6,
      seedOffset: 3000,
      spawnRegion: {
        kind: 'line',
        startX: -260,
        startZ: 40,
        endX: -260 + 5 * 18,
        endZ: 40,
        y: 14,
        jitterX: 4,
        jitterZ: 10,
      },
      waypointPattern: {
        kind: 'ingress',
        waypoint1: { x: -40, y: 14, z: 0 },
        waypoint2: { x: -320, y: 14, z: 80 },
      },
    },
  ],
}

export const GOVERNANCE_FAILURE_CONFIG: ScenarioConfig = {
  ...ROUTINE_PATROL_CONFIG,
  id: 'governance_failure',
  label: 'Governance Failure',
  description: 'Same as routine patrol with positions scaled inward (0.6) to stress governance.',
  seed: 42,
  positionScale: { x: 0.6, y: 1, z: 0.6 },
}

export const ADVERSARIAL_COORDINATION_ATTACK_CONFIG: ScenarioConfig = {
  id: 'adversarial_coordination_attack',
  label: 'Adversarial Coordination Attack',
  description: 'Reduced friendly forces; multiple hostiles with one compromised node.',
  seed: 42,
  agentTemplates: [
    {
      role: 'PATROL',
      count: 22,
      seedOffset: 0,
      spawnRegion: { kind: 'circle', radius: 260, centerX: 0, centerZ: 0, y: 10 },
      waypointPattern: { kind: 'perimeter', numWaypoints: 4, radiusJitterMin: -30, radiusJitterMax: 30 },
    },
    {
      role: 'SURVEILLANCE',
      count: 8,
      seedOffset: 1000,
      spawnRegion: { kind: 'anchors', points: SURVEILLANCE_ANCHORS, jitterX: 12, jitterZ: 12 },
      waypointPattern: { kind: 'station', radius: 18 },
    },
    {
      role: 'ESCORT',
      count: 10,
      seedOffset: 2000,
      spawnRegion: {
        kind: 'line',
        startX: -140,
        startZ: -40,
        endX: 160,
        endZ: -40,
        y: 12,
      },
      waypointPattern: { kind: 'corridor', forwardOffset: 40, backOffset: 40 },
    },
  ],
  hostileTemplates: [
    {
      role: 'HOSTILE',
      count: 10,
      seedOffset: 3500,
      spawnRegion: {
        kind: 'line',
        startX: -260,
        startZ: 40,
        endX: -260 + 9 * 18,
        endZ: 40,
        y: 14,
        jitterX: 4,
        jitterZ: 10,
      },
      waypointPattern: {
        kind: 'ingress',
        waypoint1: { x: -40, y: 14, z: 0 },
        waypoint2: { x: -320, y: 14, z: 80 },
      },
    },
  ],
  compromiseHostileIndex: 0,
}

const CONFIGS: Record<ScenarioId, ScenarioConfig> = {
  routine_patrol: ROUTINE_PATROL_CONFIG,
  threat_detection: THREAT_DETECTION_CONFIG,
  governance_failure: GOVERNANCE_FAILURE_CONFIG,
  adversarial_coordination_attack: ADVERSARIAL_COORDINATION_ATTACK_CONFIG,
}

export function getScenarioConfig(scenarioId: ScenarioId): ScenarioConfig {
  const config = CONFIGS[scenarioId]
  if (!config) throw new Error(`Unknown scenario: ${scenarioId}`)
  return config
}
