/**
 * Scenario engine: instantiateScenario(config, seed) -> InitialSimulationState.
 * Deterministic; no side effects. Used by worker for INIT_SCENARIO and RESET.
 */

import type { AgentRenderState, AgentType, Vector3 } from '../../types/simulation'
import { createSeededRandom } from '../../lib/utils/seededRandom'
import type { ScenarioConfig, SpawnRegion, WaypointPattern } from './scenarioConfig'

export interface InitialSimulationState {
  agents: AgentRenderState[]
}

const createVector3 = (x: number, y: number, z: number): Vector3 => ({ x, y, z })

const emptyDecisionState = (observe: string): AgentRenderState['decisionState'] => ({
  stage: 'OBSERVE',
  observe,
  derive: '',
  assume: '',
  decide: '',
  act: '',
  lastActionType: 'INIT',
  lastDecisionTick: -1,
})

const ROLE_DEFAULTS: Record<
  AgentType,
  { speed: number; sensorRangeMeters: number; missionObjective: string; observeNote: string }
> = {
  PATROL: {
    speed: 3.5,
    sensorRangeMeters: 350,
    missionObjective: 'Area coverage / perimeter sweep',
    observeNote: 'Phase 3: movement only',
  },
  SURVEILLANCE: {
    speed: 1.5,
    sensorRangeMeters: 420,
    missionObjective: 'Infrastructure watch / station keeping',
    observeNote: 'Phase 3: movement only',
  },
  ESCORT: {
    speed: 2.6,
    sensorRangeMeters: 320,
    missionObjective: 'Harbor ingress / escort corridor',
    observeNote: 'Phase 3: movement only',
  },
  HOSTILE: {
    speed: 3.2,
    sensorRangeMeters: 260,
    missionObjective: 'Ingress probe towards operational area',
    observeNote: 'Hostile ingress scripted for threat scenario.',
  },
}

interface SpawnResult {
  position: Vector3
  angle?: number
  anchor?: Vector3
}

function spawnPosition(
  region: SpawnRegion,
  index: number,
  count: number,
  rng: ReturnType<typeof createSeededRandom>,
): SpawnResult {
  switch (region.kind) {
    case 'circle': {
      const radius = region.radius
      const cx = region.centerX ?? 0
      const cz = region.centerZ ?? 0
      const y = region.y ?? 10
      const baseAngle = (index / count) * Math.PI * 2
      const jitter = rng.nextInRange(-0.18, 0.18)
      const angle = baseAngle + jitter
      const x = cx + Math.cos(angle) * radius
      const z = cz + Math.sin(angle) * radius * 0.6
      return { position: createVector3(x, y, z), angle }
    }
    case 'line': {
      const y = region.y ?? 12
      const jx = region.jitterX ?? 6
      const jz = region.jitterZ ?? 4
      const t = count > 1 ? index / (count - 1) : 0
      const x = region.startX + (region.endX - region.startX) * t + rng.nextInRange(-jx, jx)
      const z = region.startZ + (region.endZ - region.startZ) * t + rng.nextInRange(-jz, jz)
      return { position: createVector3(x, y, z) }
    }
    case 'anchors': {
      const points = region.points
      const anchor = points[index % points.length]
      const jx = region.jitterX ?? 12
      const jz = region.jitterZ ?? 12
      const position = createVector3(
        anchor.x + rng.nextInRange(-jx, jx),
        anchor.y,
        anchor.z + rng.nextInRange(-jz, jz),
      )
      return { position, anchor }
    }
    case 'grid': {
      const y = region.y ?? 10
      const rows = region.rows
      const row = index % rows
      const col = Math.floor(index / rows)
      const x = region.originX + col * region.spacingX + rng.nextInRange(-2, 2)
      const z = region.originZ + row * region.spacingZ + rng.nextInRange(-2, 2)
      return { position: createVector3(x, y, z) }
    }
    default:
      return { position: createVector3(0, 10, 0) }
  }
}

function waypointsFromPattern(
  pattern: WaypointPattern,
  spawn: SpawnResult,
  rng: ReturnType<typeof createSeededRandom>,
  spawnRegion?: SpawnRegion,
): Vector3[] {
  switch (pattern.kind) {
    case 'perimeter': {
      const angle = spawn.angle ?? 0
      const num = pattern.numWaypoints
      const jitterMin = pattern.radiusJitterMin ?? -30
      const jitterMax = pattern.radiusJitterMax ?? 30
      const radius = 260
      const y = spawn.position.y
      const waypoints: Vector3[] = []
      for (let j = 0; j < num; j += 1) {
        const wpAngle = angle + (j * Math.PI) / 2
        const wpRadius = radius + rng.nextInRange(jitterMin, jitterMax)
        waypoints.push(createVector3(Math.cos(wpAngle) * wpRadius, y, Math.sin(wpAngle) * wpRadius * 0.6))
      }
      return waypoints
    }
    case 'station': {
      const anchor = spawn.anchor ?? spawn.position
      const radius = pattern.radius
      const waypoints: Vector3[] = []
      for (let j = 0; j < 3; j += 1) {
        const angle = (j / 3) * Math.PI * 2
        waypoints.push(
          createVector3(
            anchor.x + Math.cos(angle) * radius,
            anchor.y,
            anchor.z + Math.sin(angle) * radius,
          ),
        )
      }
      return waypoints
    }
    case 'corridor': {
      const fwd = pattern.forwardOffset ?? 40
      const back = pattern.backOffset ?? 40
      const y = spawn.position.y
      if (spawnRegion?.kind === 'line') {
        return [
          createVector3(spawnRegion.endX + fwd, y, spawnRegion.endZ),
          createVector3(spawnRegion.startX - back, y, spawnRegion.startZ),
        ]
      }
      return [
        createVector3(160 + fwd, y, -40),
        createVector3(-140 - back, y, -40),
      ]
    }
    case 'ingress':
      return [pattern.waypoint1, pattern.waypoint2]
    default:
      return [spawn.position]
  }
}

function agentId(role: AgentType, index: number): string {
  const prefix = role === 'PATROL' ? 'PATROL' : role === 'SURVEILLANCE' ? 'SURV' : role === 'ESCORT' ? 'ESCORT' : 'HOSTILE'
  return `${prefix}_${index + 1}`
}

export function instantiateScenario(config: ScenarioConfig, seed: number): InitialSimulationState {
  const baseSeed = seed
  const agents: AgentRenderState[] = []

  const templates = [...(config.agentTemplates ?? []), ...(config.hostileTemplates ?? [])]

  for (let t = 0; t < templates.length; t += 1) {
    const template = templates[t]
    const role = template.role as AgentType
    const seedOffset = template.seedOffset ?? t * 1000
    const def = ROLE_DEFAULTS[role]
    const count = template.count

    for (let i = 0; i < count; i += 1) {
      const rng = createSeededRandom(baseSeed + seedOffset + i * 100)
      const spawn = spawnPosition(template.spawnRegion, i, count, rng)
      const waypoints = waypointsFromPattern(
        template.waypointPattern,
        spawn,
        rng,
        template.spawnRegion,
      )
      const position = spawn.position
      const headingDeg =
        spawn.angle !== undefined ? (spawn.angle * 180) / Math.PI : 0

      const speed = template.speed ?? def.speed
      const sensorRangeMeters = template.sensorRangeMeters ?? def.sensorRangeMeters
      const missionObjective = template.missionObjective ?? def.missionObjective

      let status: AgentRenderState['status'] = 'ON_MISSION'
      let finalMissionObjective = missionObjective
      if (
        role === 'HOSTILE' &&
        config.compromiseHostileIndex !== undefined &&
        i === config.compromiseHostileIndex
      ) {
        status = 'COMPROMISED'
        finalMissionObjective = 'Compromised node emitting false coordination data'
      }

      agents.push({
        id: agentId(role, i),
        type: role,
        position: { ...position },
        headingDeg,
        speed,
        batteryPercent: 100,
        sensorRangeMeters,
        missionObjective: finalMissionObjective,
        status,
        decisionState: emptyDecisionState(def.observeNote),
        chainHeadHash: null,
        recentProofBundles: [],
        waypoints,
        currentWaypointIndex: 0,
        trail: [position],
      })
    }
  }

  const scale = config.positionScale
  if (scale && (scale.x !== 1 || scale.y !== 1 || scale.z !== 1)) {
    const sx = scale.x ?? 1
    const sy = scale.y ?? 1
    const sz = scale.z ?? 1
    for (const agent of agents) {
      agent.position = {
        x: agent.position.x * sx,
        y: agent.position.y * sy,
        z: agent.position.z * sz,
      }
      agent.trail = [agent.position]
      agent.waypoints = agent.waypoints.map((w) => ({
        x: w.x * sx,
        y: w.y * sy,
        z: w.z * sz,
      }))
    }
  }

  return { agents }
}
