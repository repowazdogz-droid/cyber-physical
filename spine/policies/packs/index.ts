/**
 * Policy Pack Index
 * 
 * Registers all default policy packs.
 * 
 * Version: 1.0.0
 */

import { registerPolicyPack } from '../PolicyPackRegistry';
import { uavSafetyConservativePack } from './uav_safety_conservative';
import { learningPrivacyDefaultPack } from './learning_privacy_default';
import { xrComfortDefaultPack } from './xr_comfort_default';

// Register default packs
registerPolicyPack(uavSafetyConservativePack);
registerPolicyPack(learningPrivacyDefaultPack);
registerPolicyPack(xrComfortDefaultPack);








































