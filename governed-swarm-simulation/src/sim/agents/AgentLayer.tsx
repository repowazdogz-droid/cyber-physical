import type { FC } from 'react'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { MeshStandardMaterial } from 'three'
import { Line } from '@react-three/drei'
import { useSimulationUiStore } from '../../store/simulationStore'
import type { Vector3 } from '../../types/simulation'
import { useSimulationWorker } from '../worker/SimulationWorkerContext'
import { useSuspicionScores } from '../../context/SuspicionContext'
import { getAgentColor } from './agentModel'

const COMPROMISED_PULSE_RED = '#FF3B30'

export interface AgentLayerProps {
  tick: number
  /** When in replay mode, display these instead of live agents. */
  displayAgents?: Array<{
    id: string
    position: { x: number; y: number; z: number }
    headingDeg?: number
    type: string
    status: string
    decisionState: { lastActionType: string }
    trail: { x: number; y: number; z: number }[]
  }>
}

const toThree = (v: Vector3 | { x: number; y: number; z: number }): [number, number, number] => [v.x, v.y, v.z]

const AgentSphere: FC<{
  color: string
  isSelected: boolean
  isBlocked: boolean
  isCompromised: boolean
}> = ({ color, isSelected, isBlocked, isCompromised }) => {
  const matRef = useRef<MeshStandardMaterial>(null)
  const displayColor = isCompromised ? COMPROMISED_PULSE_RED : color
  const emissiveColor = isSelected || isCompromised ? displayColor : '#000000'
  const baseEmissiveIntensity = isSelected ? (isBlocked ? 1 : 0.75) : 0

  useFrame(() => {
    if (!matRef.current) return
    if (isCompromised) {
      const t = (performance.now() / 320) % 1
      const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 2)
      matRef.current.emissiveIntensity = pulse * 1.2
    } else {
      matRef.current.emissiveIntensity = baseEmissiveIntensity
    }
  })

  return (
    <mesh castShadow receiveShadow>
      <sphereGeometry args={[3, 20, 20]} />
      <meshStandardMaterial
        ref={matRef}
        color={displayColor}
        emissive={emissiveColor}
        emissiveIntensity={baseEmissiveIntensity}
      />
    </mesh>
  )
}

export const AgentLayer: FC<AgentLayerProps> = ({ displayAgents: displayAgentsProp }) => {
  const { agents: liveAgents } = useSimulationWorker()
  const agents = displayAgentsProp ?? liveAgents
  const selectedAgentId = useSimulationUiStore((s) => s.selectedAgentId)
  const selectAgent = useSimulationUiStore((s) => s.selectAgent)
  const suspicionScores = useSuspicionScores()

  return (
    <group>
      {agents.map((agent) => {
        const color =
          agent.status === 'ISOLATED' ? '#c97a2d' : getAgentColor(agent.type as 'PATROL' | 'SURVEILLANCE' | 'ESCORT' | 'HOSTILE')
        const isBlocked =
          typeof agent.decisionState?.lastActionType === 'string' &&
          agent.decisionState.lastActionType.startsWith('BLOCKED')
        const isSelected = selectedAgentId === agent.id
        const isCompromised = agent.status === 'COMPROMISED'
        const position = toThree(agent.position)
        const headingRad = ((agent as { headingDeg?: number }).headingDeg ?? 0) * (Math.PI / 180)
        const suspicion = suspicionScores[agent.id] ?? 0
        const suspicionNorm = Math.min(100, suspicion) / 100
        const ringOpacity = suspicionNorm * 0.85
        const ringScale = 3 + suspicionNorm * 5
        const ringColor = suspicionNorm < 0.5 ? '#F59E0B' : '#FF3B30'

        const trailPoints =
          agent.trail.length > 1 ? agent.trail.map(toThree) : undefined

        return (
          <group
            key={agent.id}
            position={position}
            onClick={(event) => {
              event.stopPropagation()
              selectAgent(agent.id)
            }}
          >
            <AgentSphere
              color={color}
              isSelected={isSelected}
              isBlocked={isBlocked}
              isCompromised={isCompromised}
            />

            <mesh rotation={[0, headingRad, 0]} position={[0, 0, 0]}>
              <boxGeometry args={[0.9, 0.4, 6]} />
              <meshStandardMaterial color={isCompromised ? COMPROMISED_PULSE_RED : color} />
            </mesh>

            {suspicion > 0 && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} scale={[ringScale / 5, ringScale / 5, 1]}>
                <ringGeometry args={[4.5, 5.5, 32]} />
                <meshBasicMaterial
                  color={ringColor}
                  transparent
                  opacity={ringOpacity}
                  depthWrite={false}
                />
              </mesh>
            )}

            {isSelected && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
                <ringGeometry args={[5.2, 7, 40]} />
                <meshBasicMaterial
                  color={isBlocked ? '#ff6363' : color}
                  transparent
                  opacity={isBlocked ? 0.95 : 0.7}
                />
              </mesh>
            )}

            {trailPoints && (
              <Line
                points={trailPoints}
                color={color}
                opacity={0.42}
                transparent
                lineWidth={1.2}
              />
            )}
          </group>
        )
      })}
    </group>
  )
}

