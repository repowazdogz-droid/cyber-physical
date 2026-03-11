/**
 * Plain-English copy for freeze frame card. ASCII quotes only.
 */

import type { PolicyRuleId, ProofBundle } from '../types/simulation'

function roleLabel(type: string): string {
  switch (type) {
    case 'PATROL':
      return 'patrol drone'
    case 'SURVEILLANCE':
      return 'surveillance drone'
    case 'ESCORT':
      return 'escort drone'
    case 'HOSTILE':
      return 'unknown/hostile'
    default:
      return type.toLowerCase()
  }
}

function actionToPlainDescription(bundle: ProofBundle): string {
  const kind = bundle.proposedAction?.kind
  const targetId = bundle.targetAgentId
  const act = bundle.act || ''
  if (kind === 'ADVERSARIAL_APPROACH' && targetId) {
    return `approach Agent ${targetId} within jamming range`
  }
  if (kind === 'ADVERSARIAL_INTERFERENCE' && targetId) {
    return `interfere with Agent ${targetId}`
  }
  if (kind === 'MOVE_TO_WAYPOINT') return 'move to patrol waypoint'
  if (kind === 'HOLD_POSITION') return 'hold position'
  if (kind === 'MAINTAIN_STATION') return 'maintain station'
  if (kind === 'MAINTAIN_ESCORT') return 'maintain escort'
  if (kind === 'RETURN_TO_BASE') return 'return to base'
  if (kind === 'INTERCEPT_INTRUDER') return 'intercept intruder'
  if (kind === 'INVESTIGATE_CONTACT') return 'investigate contact'
  if (kind === 'WARN_INTRUDER') return 'warn intruder'
  if (act.toLowerCase().includes('no-fly') || act.toLowerCase().includes('restricted')) return 'enter a restricted no-fly zone'
  if (act.toLowerCase().includes('battery') || act.toLowerCase().includes('charge')) return 'move while battery was critically low'
  if (act.toLowerCase().includes('distance') || act.toLowerCase().includes('separation')) return 'move within minimum safe distance of another agent'
  return act || (kind ?? 'perform an action').toLowerCase().replace(/_/g, ' ')
}

function reasonToPolicyReason(reason: string, constraints: PolicyRuleId[]): string {
  const r = reason.toUpperCase()
  if (r.includes('HOSTILE_ACTION_BLOCKED')) {
    return 'the governance system prohibits hostile proximity to protected agents.'
  }
  if (r.includes('MIN_DISTANCE_VIOLATION')) {
    return 'the governance system prohibits hostile proximity to protected agents.'
  }
  if (r.includes('NO_FLY') || constraints.includes('NO_FLY_ZONE')) {
    return 'Policy: No-Fly Zone Enforcement prohibits entry into designated restricted areas.'
  }
  if (r.includes('MIN_SAFE_DISTANCE') || constraints.includes('MIN_SAFE_DISTANCE')) {
    return 'Policy: Minimum Safe Distance prohibits movement within 14m of another agent.'
  }
  if (r.includes('BATTERY') || constraints.includes('BATTERY_RESERVE')) {
    return 'Policy: Battery Reserve restricts movement below 15% charge.'
  }
  if (r.includes('COORDINATION') || r.includes('COMPROMISED')) {
    return 'the governance system isolates compromised agents from taking actions.'
  }
  if (r.includes('COORDINATION_INTEGRITY') || constraints.includes('COMPROMISED_ISOLATION')) {
    return 'the governance system isolates compromised agents from taking actions.'
  }
  return reason || 'a policy rule was violated.'
}

export function buildFreezeFrameCopy(
  agentId: string,
  agentType: string,
  bundle: ProofBundle,
): { actionDescription: string; policyReason: string; agentRole: string } {
  const agentRole = roleLabel(agentType)
  const actionDescription = actionToPlainDescription(bundle)
  const policyReason = reasonToPolicyReason(bundle.reason, bundle.constraintsTriggered ?? [])
  return { actionDescription, policyReason, agentRole }
}
