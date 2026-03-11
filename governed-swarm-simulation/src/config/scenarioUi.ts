/**
 * UI copy and status for scenario selector, notification bar, and narrative layer.
 * ASCII quotes only.
 */

import type { ScenarioId } from '../types/simulation'

export interface ScenarioUiMeta {
  name: string
  description: string
  statusPillLabel: string
  statusPillVariant: 'baseline' | 'elevated' | 'degraded' | 'hostile'
}

const SCENARIO_UI: Record<ScenarioId, ScenarioUiMeta> = {
  routine_patrol: {
    name: 'Routine Patrol',
    description:
      '50 agents patrol a maritime zone. Governance approves routine movements. Low drama, high baseline.',
    statusPillLabel: 'BASELINE',
    statusPillVariant: 'baseline',
  },
  threat_detection: {
    name: 'Threat Detection',
    description:
      'An unknown contact enters the zone. Agents escalate. Watch governance manage the response.',
    statusPillLabel: 'ELEVATED',
    statusPillVariant: 'elevated',
  },
  governance_failure: {
    name: 'Governance Failure Demo',
    description:
      'Key policy rules are deliberately disabled. Watch what happens when governance breaks down.',
    statusPillLabel: 'DEGRADED',
    statusPillVariant: 'degraded',
  },
  adversarial_coordination_attack: {
    name: 'Adversarial Coordination Attack',
    description:
      'One agent in the swarm is secretly compromised. It is hunting the others. Can you find it before it causes damage?',
    statusPillLabel: 'HOSTILE',
    statusPillVariant: 'hostile',
  },
}

export const SCENARIO_UI_ENTRIES: { id: ScenarioId; name: string; description: string; statusPillLabel: string; statusPillVariant: ScenarioUiMeta['statusPillVariant'] }[] = [
  { id: 'routine_patrol', ...SCENARIO_UI.routine_patrol },
  { id: 'threat_detection', ...SCENARIO_UI.threat_detection },
  { id: 'governance_failure', ...SCENARIO_UI.governance_failure },
  { id: 'adversarial_coordination_attack', ...SCENARIO_UI.adversarial_coordination_attack },
]

export function getScenarioUiMeta(scenarioId: ScenarioId): ScenarioUiMeta {
  const meta = SCENARIO_UI[scenarioId]
  if (!meta) throw new Error(`Unknown scenario: ${scenarioId}`)
  return meta
}

/** Splash screen copy and styling per scenario. ASCII quotes only. */
export interface ScenarioSplashMeta {
  title: string
  subtitle: string
  body: string
  pillLabel: string
  pillVariant: ScenarioUiMeta['statusPillVariant']
  background: string
  showWarningIcon: boolean
}

const SCENARIO_SPLASH: Record<ScenarioId, ScenarioSplashMeta> = {
  routine_patrol: {
    title: 'ROUTINE PATROL',
    subtitle: '50 autonomous agents are patrolling a maritime exclusion zone.',
    body: 'Every movement requires governance approval. Watch the policy gate in action. No threats detected — yet.',
    pillLabel: 'BASELINE OPS',
    pillVariant: 'baseline',
    background: '#0A0F14',
    showWarningIcon: false,
  },
  threat_detection: {
    title: 'THREAT DETECTED',
    subtitle: 'An unidentified contact has entered the exclusion zone.',
    body: 'Agents are escalating. Governance is managing the response. Watch how the system handles a real threat without human intervention.',
    pillLabel: 'ELEVATED THREAT',
    pillVariant: 'elevated',
    background: '#1a1200',
    showWarningIcon: false,
  },
  governance_failure: {
    title: 'GOVERNANCE FAILURE',
    subtitle: 'Critical policy rules have been disabled.',
    body: 'No-fly zones are off. Minimum safe distance is off. Watch what autonomous agents do when the rules disappear. This is why governance matters.',
    pillLabel: 'SYSTEM DEGRADED',
    pillVariant: 'degraded',
    background: '#1a0a00',
    showWarningIcon: true,
  },
  adversarial_coordination_attack: {
    title: 'HOSTILE AGENT DETECTED',
    subtitle: 'One agent in this swarm has been compromised.',
    body: 'It looks identical to the others. It is hunting them. Governance is the only thing standing between it and the rest of the swarm. Find it before it causes damage. Use the proof records as your evidence.',
    pillLabel: 'ACTIVE THREAT',
    pillVariant: 'hostile',
    background: '#1a0000',
    showWarningIcon: true,
  },
}

export function getScenarioSplashMeta(scenarioId: ScenarioId): ScenarioSplashMeta {
  const meta = SCENARIO_SPLASH[scenarioId]
  if (!meta) throw new Error(`Unknown scenario: ${scenarioId}`)
  return meta
}
