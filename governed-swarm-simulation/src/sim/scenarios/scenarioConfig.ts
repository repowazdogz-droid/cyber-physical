/**
 * Declarative scenario configuration. JSON-compatible; no functions.
 * All generation is deterministic from seed.
 */

import type { ScenarioId } from '../../types/simulation'

export type AgentRole = 'PATROL' | 'SURVEILLANCE' | 'ESCORT' | 'HOSTILE'

/** Spawn region: where agents are placed. Seed + index determine exact position. */
export type SpawnRegion =
  | { kind: 'circle'; radius: number; centerX?: number; centerZ?: number; y?: number }
  | {
      kind: 'grid'
      rows: number
      cols: number
      spacingX: number
      spacingZ: number
      originX: number
      originZ: number
      y?: number
    }
  | {
      kind: 'line'
      startX: number
      startZ: number
      endX: number
      endZ: number
      y?: number
      jitterX?: number
      jitterZ?: number
    }
  | {
      kind: 'anchors'
      points: { x: number; y: number; z: number }[]
      jitterX?: number
      jitterZ?: number
    }

/** Waypoint pattern: how waypoints are derived from spawn position/angle. */
export type WaypointPattern =
  | {
      kind: 'perimeter'
      numWaypoints: number
      radiusJitterMin?: number
      radiusJitterMax?: number
    }
  | { kind: 'station'; radius: number }
  | { kind: 'corridor'; forwardOffset?: number; backOffset?: number }
  | { kind: 'ingress'; waypoint1: { x: number; y: number; z: number }; waypoint2: { x: number; y: number; z: number } }

export interface AgentTemplate {
  role: AgentRole
  count: number
  spawnRegion: SpawnRegion
  waypointPattern: WaypointPattern
  /** Seed offset for this template (deterministic stream). */
  seedOffset?: number
  /** Override mission objective text. */
  missionObjective?: string
  speed?: number
  sensorRangeMeters?: number
}

/** Script event (JSON-compatible). Applied at runtime by engine if needed. */
export type ScriptEvent =
  | { type: 'spawnHostiles'; count?: number; templateIndex?: number }
  | { type: 'policyChange'; policyKey: string; value: boolean }
  | { type: 'threatEscalation'; level: string }
  | { type: 'compromiseAgent'; agentIndex?: number; agentId?: string }

export interface ScriptPhase {
  startTick: number
  endTick: number
  events: ScriptEvent[]
}

/** Policy overrides at run start (optional). */
export interface PolicyOverrides {
  noFlyZone?: boolean
  minSafeDistance?: boolean
  escalationProtocol?: boolean
  batteryReserve?: boolean
}

export interface ScenarioConfig {
  id: ScenarioId
  label: string
  description: string
  seed: number
  agentTemplates: AgentTemplate[]
  hostileTemplates?: AgentTemplate[]
  policyOverrides?: PolicyOverrides
  scriptPhases?: ScriptPhase[]
  /** Optional: scale all initial positions (e.g. governance_failure uses 0.6). */
  positionScale?: { x?: number; y?: number; z?: number }
  /** Optional: at init, set one hostile to COMPROMISED (by index in hostile list). */
  compromiseHostileIndex?: number
}
