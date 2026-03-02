/**
 * XR Comfort Default Policy Pack
 * 
 * Comfort policies for XR surfaces.
 * Asserts reduce-motion respected and clamps motion intensity metadata.
 * 
 * Version: 1.0.0
 */

import { PolicyPack } from '../PolicyPackTypes';
import { CONTRACT_VERSION } from '../../contracts/ContractVersion';

export const xrComfortDefaultPack: PolicyPack = {
  contractVersion: CONTRACT_VERSION,
  descriptor: {
    id: "xr_comfort_default",
    version: "1.0.0",
    description: "Default comfort policies for XR. Reduce motion respected; motion intensity clamped for display.",
    domains: ["xr"]
  },
  overrides: [],
  disallows: [],
  constraints: [
    {
      id: "xr_reduce_motion_required",
      type: "cap_motion_intensity",
      maxValue: 0, // Special: indicates reduce motion must be respected
      reason: "Reduce motion preference must be respected in XR display"
    },
    {
      id: "xr_clamp_motion_intensity",
      type: "cap_motion_intensity",
      maxValue: 5, // Scale 0-10, clamp to 5 max
      reason: "Motion intensity metadata clamped to safe range (display-only constraint)"
    }
  ]
};








































