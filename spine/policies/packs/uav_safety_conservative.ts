/**
 * UAV Safety Conservative Policy Pack
 * 
 * Conservative safety policies for UAV operations.
 * Mirrors decision-square overrides/disallows in policy form.
 * 
 * Version: 1.0.0
 */

import { PolicyPack } from '../PolicyPackTypes';
import { PolicyOverrideContract } from '../../contracts/PolicyContracts';
import { CONTRACT_VERSION } from '../../contracts/ContractVersion';

export const uavSafetyConservativePack: PolicyPack = {
  contractVersion: CONTRACT_VERSION,
  descriptor: {
    id: "uav_safety_conservative",
    version: "1.0.0",
    description: "Conservative safety policies for UAV safe landing. Emergency overrides and disallows for critical conditions.",
    domains: ["uav"]
  },
  overrides: [
    {
      contractVersion: CONTRACT_VERSION,
      overrideId: "uav_emergency_h4_failure",
      forcedOutcome: "S4",
      reason: "Health system failure (H4) detected. Emergency landing required.",
      priority: 100,
      condition: "healthStatus === H4_FAILURE"
    },
    {
      contractVersion: CONTRACT_VERSION,
      overrideId: "uav_emergency_e4_unsafe",
      forcedOutcome: "S4",
      reason: "Environment is unsafe (E4). Emergency landing required.",
      priority: 95,
      condition: "environment === E4_UNSAFE"
    },
    {
      contractVersion: CONTRACT_VERSION,
      overrideId: "uav_imminent_t1",
      forcedOutcome: "S4",
      reason: "Imminent time to contact (T1) detected. Emergency landing required.",
      priority: 90,
      condition: "timeToContact === T1_IMMINENT"
    },
    {
      contractVersion: CONTRACT_VERSION,
      overrideId: "uav_extreme_e3",
      forcedOutcome: "S3",
      reason: "Extreme environment (E3) detected. Initiating landing as a precaution.",
      priority: 80,
      condition: "environment === E3_EXTREME"
    }
  ],
  disallows: [
    {
      id: "uav_disallow_h4",
      outcome: "S1",
      reason: "Cannot continue mission with H4 failure. Emergency landing required.",
      priority: 100
    },
    {
      id: "uav_disallow_e4",
      outcome: "S1",
      reason: "Cannot continue mission in E4 unsafe environment. Emergency landing required.",
      priority: 95
    }
  ],
  constraints: [
    {
      id: "uav_cap_trace_nodes",
      type: "cap_trace_nodes",
      maxValue: 100,
      reason: "Trace nodes capped to 100 for bounded storage"
    }
  ]
};








































