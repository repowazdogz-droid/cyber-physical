import type { FC } from 'react'
import { useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useShallow } from 'zustand/react/shallow'
import {
  HARBOR_STRUCTURES,
  INFRASTRUCTURE_MARKERS,
  NO_GO_ZONES,
  WORLD_EXTENTS,
} from './worldConfig'
import { AgentLayer } from '../agents/AgentLayer'
import { useSimulationUiStore } from '../../store/simulationStore'

const Ocean: FC = () => {
  const size = WORLD_EXTENTS.oceanSize
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[size, size, 64, 64]} />
      <meshStandardMaterial
        color="#07293f"
        roughness={0.35}
        metalness={0.15}
      />
    </mesh>
  )
}

const Coastline: FC = () => {
  const { coastlineWidth, oceanSize } = WORLD_EXTENTS
  return (
    <group>
      <mesh
        position={[0, 6, -(oceanSize / 2 - coastlineWidth / 2)]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[oceanSize, 12, coastlineWidth]} />
        <meshStandardMaterial color="#171b23" roughness={0.85} metalness={0.05} />
      </mesh>
      <mesh
        position={[-220, 5, -40]}
        rotation={[0, (12 * Math.PI) / 180, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[260, 10, 90]} />
        <meshStandardMaterial color="#191d27" roughness={0.82} metalness={0.08} />
      </mesh>
    </group>
  )
}

const HarborStructures: FC = () => {
  return (
    <group>
      {HARBOR_STRUCTURES.map((structure) => (
        <mesh
          key={structure.id}
          position={structure.position}
          castShadow
          receiveShadow
        >
          <boxGeometry args={structure.size} />
          <meshStandardMaterial color="#252c3a" roughness={0.6} metalness={0.25} />
        </mesh>
      ))}
    </group>
  )
}

const InfrastructureMarkers: FC = () => {
  return (
    <group>
      {INFRASTRUCTURE_MARKERS.map((marker) => {
        if (marker.kind === 'PLATFORM') {
          return (
            <mesh
              key={marker.id}
              position={marker.position}
              castShadow
              receiveShadow
            >
              <cylinderGeometry args={[10, 10, 6, 16]} />
              <meshStandardMaterial color="#4ea6ff" roughness={0.4} metalness={0.4} />
            </mesh>
          )
        }

        if (marker.kind === 'BUOY') {
          return (
            <mesh
              key={marker.id}
              position={marker.position}
              castShadow
              receiveShadow
            >
              <sphereGeometry args={[3.2, 20, 20]} />
              <meshStandardMaterial color="#f3b34c" roughness={0.3} metalness={0.3} />
            </mesh>
          )
        }

        return (
          <mesh
            key={marker.id}
            position={marker.position}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[6, 3, 6]} />
            <meshStandardMaterial color="#7dd3ff" roughness={0.4} metalness={0.35} />
          </mesh>
        )
      })}

      {/* Subsea cable corridor line */}
      <mesh position={[-120, 0.5, 40]} rotation={[0, 0, 0]}>
        <boxGeometry args={[260, 0.8, 1.1]} />
        <meshStandardMaterial color="#7dd3ff" roughness={0.3} metalness={0.7} />
      </mesh>
    </group>
  )
}

const NoGoZones: FC = () => {
  return (
    <group>
      {NO_GO_ZONES.map((zone) => (
        <group key={zone.id} position={zone.center}>
          <mesh>
            <boxGeometry args={zone.size} />
            <meshStandardMaterial
              color="#ff4b6a"
              transparent
              opacity={0.34}
              depthWrite={false}
            />
          </mesh>
          <lineSegments>
            <boxGeometry args={zone.size} />
            <lineBasicMaterial color="#ffb3bd" />
          </lineSegments>
        </group>
      ))}
    </group>
  )
}

const Atmosphere: FC = () => {
  return (
    <>
      <color attach="background" args={['#020309']} />
      <fog attach="fog" args={['#020309', 120, 520]} />

      <hemisphereLight
        intensity={0.45}
        color="#5b8bd9"
        groundColor="#05060b"
      />

      <directionalLight
        position={[180, 260, 120]}
        intensity={1.4}
        color="#f9f5ef"
        castShadow
      />

      <ambientLight intensity={0.32} />
    </>
  )
}

interface WorldContentsProps {
  tick: number
}

function snapshotToDisplayAgents(
  snapshot: { agentStates: { id: string; position: [number, number, number]; status: string; governanceResult: string; action: string }[] },
  agentsById: Record<string, { type: string }>,
): { id: string; position: { x: number; y: number; z: number }; headingDeg: number; type: string; status: string; decisionState: { lastActionType: string }; trail: { x: number; y: number; z: number }[] }[] {
  return snapshot.agentStates.map((as) => ({
    id: as.id,
    position: { x: as.position[0], y: as.position[1], z: as.position[2] },
    headingDeg: 0,
    type: (agentsById[as.id] as { type: string } | undefined)?.type ?? 'PATROL',
    status: as.status,
    decisionState: {
      lastActionType: as.governanceResult === 'BLOCKED' ? `BLOCKED:${as.action}` : as.action,
    } as { lastActionType: string },
    trail: [{ x: as.position[0], y: as.position[1], z: as.position[2] }],
  }))
}

const WorldContents: FC<WorldContentsProps> = ({ tick }) => {
  const isReplayMode = useSimulationUiStore((s) => s.isReplayMode)
  const replayTick = useSimulationUiStore((s) => s.replayTick)
  const agentsById = useSimulationUiStore(useShallow((s) => s.agentsById))
  const getSnapshotAt = useSimulationUiStore((s) => s.getSnapshotAt)
  const snapshot = useMemo(
    () => isReplayMode ? getSnapshotAt(replayTick) : undefined,
    [isReplayMode, replayTick, getSnapshotAt]
  )
  const displayAgentsFromReplay =
    snapshot != null ? snapshotToDisplayAgents(snapshot, agentsById) : undefined

  return (
    <>
      <Atmosphere />
      <Ocean />
      <Coastline />
      <HarborStructures />
      <InfrastructureMarkers />
      <NoGoZones />
      <AgentLayer tick={tick} displayAgents={displayAgentsFromReplay} />
      <FollowCameraControls />
    </>
  )
}

const FollowCameraControls: FC = () => {
  const { camera } = useThree()
  const selectedAgentId = useSimulationUiStore((s) => s.selectedAgentId)
  const agentsById = useSimulationUiStore((s) => s.agentsById)
  const followSelectedAgent = useSimulationUiStore((s) => s.followSelectedAgent)
  const isReplayMode = useSimulationUiStore((s) => s.isReplayMode)
  const replayTick = useSimulationUiStore((s) => s.replayTick)
  const getSnapshotAt = useSimulationUiStore((s) => s.getSnapshotAt)

  const selectedAgent = selectedAgentId ? agentsById[selectedAgentId] : undefined
  const replayPosition = useMemo(() => {
    if (!isReplayMode || !selectedAgent) return null
    const snap = getSnapshotAt(replayTick)
    const as = snap?.agentStates.find((a) => a.id === selectedAgent.id)
    return as
      ? { x: as.position[0], y: as.position[1], z: as.position[2] }
      : selectedAgent.position
  }, [isReplayMode, selectedAgent, replayTick, getSnapshotAt])

  useFrame(() => {
    if (!followSelectedAgent || !selectedAgent) return

    const target = replayPosition ?? selectedAgent.position
    const desired = {
      x: target.x + 60,
      y: target.y + 80,
      z: target.z + 100,
    }

    // R3F/Three: mutating camera.position in useFrame is the standard follow-camera pattern
    /* eslint-disable react-hooks/immutability */
    camera.position.x += (desired.x - camera.position.x) * 0.08
    camera.position.y += (desired.y - camera.position.y) * 0.08
    camera.position.z += (desired.z - camera.position.z) * 0.08
    /* eslint-enable react-hooks/immutability */
  })

  return (
    <OrbitControls
      enableDamping
      dampingFactor={0.08}
      maxDistance={520}
      minDistance={90}
      maxPolarAngle={Math.PI / 2.1}
      target={[0, 20, 0]}
    />
  )
}

export interface WorldSceneProps {
  tick: number
}

export const WorldScene: FC<WorldSceneProps> = ({ tick }) => {
  return (
    <Canvas
      shadows
      camera={{ position: [220, 200, 260], fov: 46 }}
      gl={{ antialias: true, alpha: true }}
    >
      <WorldContents tick={tick} />
    </Canvas>
  )
}

