/**
 * Spec Validator
 * 
 * Pure structural + bounds validator for kernel specs.
 * Returns bounded errors and warnings.
 * 
 * Version: 1.0.0
 */

import {
  KernelSpec,
  OutcomeMapping,
  Condition,
  PolicySpec,
  OverrideSpec,
  DisallowSpec,
  MAX_OUTCOMES,
  MAX_POLICIES,
  MAX_OVERRIDES,
  MAX_DISALLOWS,
  MAX_CONDITIONS,
  MAX_STRING_LENGTH,
  MAX_NAME_LENGTH,
  MAX_ID_LENGTH
} from './SpecTypes';

/**
 * Validation error.
 */
export interface ValidationError {
  /** Error code */
  code: string;
  /** Path to field (max 200 chars) */
  path: string;
  /** Message (max 200 chars) */
  message: string;
}

/**
 * Validation warning.
 */
export interface ValidationWarning {
  /** Warning code */
  code: string;
  /** Path to field (max 200 chars) */
  path: string;
  /** Message (max 200 chars) */
  message: string;
}

/**
 * Validation result.
 */
export interface ValidationResult {
  /** Whether validation passed */
  ok: boolean;
  /** Errors (bounded, max 50) */
  errors: ValidationError[];
  /** Warnings (bounded, max 50) */
  warnings: ValidationWarning[];
}

/**
 * Bounds a string to max length.
 */
function boundString(text: string, maxLen: number): string {
  if (typeof text !== 'string') return String(text);
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 3) + '...';
}

/**
 * Validates a condition.
 */
function validateCondition(condition: Condition, path: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!condition.signalKey || typeof condition.signalKey !== 'string') {
    errors.push({
      code: 'INVALID_SIGNAL_KEY',
      path: `${path}.signalKey`,
      message: 'Signal key must be a non-empty string'
    });
  } else if (condition.signalKey.length > MAX_NAME_LENGTH) {
    errors.push({
      code: 'SIGNAL_KEY_TOO_LONG',
      path: `${path}.signalKey`,
      message: `Signal key exceeds max length (${MAX_NAME_LENGTH})`
    });
  }

  const validOperators = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'not_in'];
  if (!validOperators.includes(condition.operator)) {
    errors.push({
      code: 'INVALID_OPERATOR',
      path: `${path}.operator`,
      message: `Operator must be one of: ${validOperators.join(', ')}`
    });
  }

  if (condition.value === undefined || condition.value === null) {
    errors.push({
      code: 'MISSING_VALUE',
      path: `${path}.value`,
      message: 'Value is required'
    });
  }

  return errors;
}

/**
 * Validates an outcome mapping.
 */
function validateOutcomeMapping(outcome: OutcomeMapping, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const path = `outcomes[${index}]`;

  if (!outcome.outcomeId || typeof outcome.outcomeId !== 'string') {
    errors.push({
      code: 'MISSING_OUTCOME_ID',
      path: `${path}.outcomeId`,
      message: 'Outcome ID is required'
    });
  } else if (outcome.outcomeId.length > MAX_ID_LENGTH) {
    errors.push({
      code: 'OUTCOME_ID_TOO_LONG',
      path: `${path}.outcomeId`,
      message: `Outcome ID exceeds max length (${MAX_ID_LENGTH})`
    });
  }

  if (!outcome.label || typeof outcome.label !== 'string') {
    errors.push({
      code: 'MISSING_LABEL',
      path: `${path}.label`,
      message: 'Label is required'
    });
  } else if (outcome.label.length > MAX_NAME_LENGTH) {
    errors.push({
      code: 'LABEL_TOO_LONG',
      path: `${path}.label`,
      message: `Label exceeds max length (${MAX_NAME_LENGTH})`
    });
  }

  const validConfidence = ['Low', 'Medium', 'High', 'Unknown'];
  if (!validConfidence.includes(outcome.confidence)) {
    errors.push({
      code: 'INVALID_CONFIDENCE',
      path: `${path}.confidence`,
      message: `Confidence must be one of: ${validConfidence.join(', ')}`
    });
  }

  if (!Array.isArray(outcome.conditions) || outcome.conditions.length === 0) {
    errors.push({
      code: 'MISSING_CONDITIONS',
      path: `${path}.conditions`,
      message: 'At least one condition is required'
    });
  } else if (outcome.conditions.length > MAX_CONDITIONS) {
    errors.push({
      code: 'TOO_MANY_CONDITIONS',
      path: `${path}.conditions`,
      message: `Conditions exceed max count (${MAX_CONDITIONS})`
    });
  } else {
    outcome.conditions.forEach((condition, idx) => {
      errors.push(...validateCondition(condition, `${path}.conditions[${idx}]`));
    });
  }

  if (outcome.rationale && typeof outcome.rationale === 'string' && outcome.rationale.length > MAX_STRING_LENGTH) {
    errors.push({
      code: 'RATIONALE_TOO_LONG',
      path: `${path}.rationale`,
      message: `Rationale exceeds max length (${MAX_STRING_LENGTH})`
    });
  }

  return errors;
}

/**
 * Validates a kernel spec.
 */
export function validateKernelSpec(spec: any): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!spec || typeof spec !== 'object') {
    return {
      ok: false,
      errors: [{
        code: 'INVALID_SPEC',
        path: '',
        message: 'Spec must be an object'
      }],
      warnings: []
    };
  }

  // Version
  if (!spec.version || typeof spec.version !== 'string') {
    errors.push({
      code: 'MISSING_VERSION',
      path: 'version',
      message: 'Version is required'
    });
  }

  // Kernel ID
  if (!spec.kernelId || typeof spec.kernelId !== 'string') {
    errors.push({
      code: 'MISSING_KERNEL_ID',
      path: 'kernelId',
      message: 'Kernel ID is required'
    });
  } else if (spec.kernelId.length > MAX_ID_LENGTH) {
    errors.push({
      code: 'KERNEL_ID_TOO_LONG',
      path: 'kernelId',
      message: `Kernel ID exceeds max length (${MAX_ID_LENGTH})`
    });
  }

  // Adapter ID
  if (!spec.adapterId || typeof spec.adapterId !== 'string') {
    errors.push({
      code: 'MISSING_ADAPTER_ID',
      path: 'adapterId',
      message: 'Adapter ID is required'
    });
  }

  // Name
  if (!spec.name || typeof spec.name !== 'string') {
    errors.push({
      code: 'MISSING_NAME',
      path: 'name',
      message: 'Name is required'
    });
  } else if (spec.name.length > MAX_NAME_LENGTH) {
    errors.push({
      code: 'NAME_TOO_LONG',
      path: 'name',
      message: `Name exceeds max length (${MAX_NAME_LENGTH})`
    });
  }

  // Description
  if (spec.description && typeof spec.description === 'string' && spec.description.length > MAX_STRING_LENGTH) {
    errors.push({
      code: 'DESCRIPTION_TOO_LONG',
      path: 'description',
      message: `Description exceeds max length (${MAX_STRING_LENGTH})`
    });
  }

  // Outcomes
  if (!Array.isArray(spec.outcomes) || spec.outcomes.length === 0) {
    errors.push({
      code: 'MISSING_OUTCOMES',
      path: 'outcomes',
      message: 'At least one outcome is required'
    });
  } else {
    if (spec.outcomes.length > MAX_OUTCOMES) {
      warnings.push({
        code: 'TOO_MANY_OUTCOMES',
        path: 'outcomes',
        message: `Outcomes exceed recommended max (${MAX_OUTCOMES})`
      });
    }

    spec.outcomes.forEach((outcome: OutcomeMapping, index: number) => {
      errors.push(...validateOutcomeMapping(outcome, index));
    });
  }

  // Policies
  if (spec.policies) {
    if (!Array.isArray(spec.policies)) {
      errors.push({
        code: 'INVALID_POLICIES',
        path: 'policies',
        message: 'Policies must be an array'
      });
    } else {
      if (spec.policies.length > MAX_POLICIES) {
        warnings.push({
          code: 'TOO_MANY_POLICIES',
          path: 'policies',
          message: `Policies exceed recommended max (${MAX_POLICIES})`
        });
      }

      spec.policies.forEach((policy: PolicySpec, index: number) => {
        const path = `policies[${index}]`;
        if (!policy.policyId || typeof policy.policyId !== 'string') {
          errors.push({
            code: 'MISSING_POLICY_ID',
            path: `${path}.policyId`,
            message: 'Policy ID is required'
          });
        }
        if (!policy.name || typeof policy.name !== 'string') {
          errors.push({
            code: 'MISSING_POLICY_NAME',
            path: `${path}.name`,
            message: 'Policy name is required'
          });
        }
        if (!Array.isArray(policy.conditions)) {
          errors.push({
            code: 'MISSING_POLICY_CONDITIONS',
            path: `${path}.conditions`,
            message: 'Policy conditions are required'
          });
        } else {
          policy.conditions.forEach((condition, idx) => {
            errors.push(...validateCondition(condition, `${path}.conditions[${idx}]`));
          });
        }
        const validActions = ['allow', 'deny', 'force', 'constrain'];
        if (!validActions.includes(policy.action)) {
          errors.push({
            code: 'INVALID_POLICY_ACTION',
            path: `${path}.action`,
            message: `Action must be one of: ${validActions.join(', ')}`
          });
        }
      });
    }
  }

  // Overrides
  if (spec.overrides) {
    if (!Array.isArray(spec.overrides)) {
      errors.push({
        code: 'INVALID_OVERRIDES',
        path: 'overrides',
        message: 'Overrides must be an array'
      });
    } else {
      if (spec.overrides.length > MAX_OVERRIDES) {
        warnings.push({
          code: 'TOO_MANY_OVERRIDES',
          path: 'overrides',
          message: `Overrides exceed recommended max (${MAX_OVERRIDES})`
        });
      }

      spec.overrides.forEach((override: OverrideSpec, index: number) => {
        const path = `overrides[${index}]`;
        if (!override.overrideId || typeof override.overrideId !== 'string') {
          errors.push({
            code: 'MISSING_OVERRIDE_ID',
            path: `${path}.overrideId`,
            message: 'Override ID is required'
          });
        }
        if (!override.forcedOutcome || typeof override.forcedOutcome !== 'string') {
          errors.push({
            code: 'MISSING_FORCED_OUTCOME',
            path: `${path}.forcedOutcome`,
            message: 'Forced outcome is required'
          });
        }
        if (!Array.isArray(override.conditions)) {
          errors.push({
            code: 'MISSING_OVERRIDE_CONDITIONS',
            path: `${path}.conditions`,
            message: 'Override conditions are required'
          });
        } else {
          override.conditions.forEach((condition, idx) => {
            errors.push(...validateCondition(condition, `${path}.conditions[${idx}]`));
          });
        }
      });
    }
  }

  // Disallows
  if (spec.disallows) {
    if (!Array.isArray(spec.disallows)) {
      errors.push({
        code: 'INVALID_DISALLOWS',
        path: 'disallows',
        message: 'Disallows must be an array'
      });
    } else {
      if (spec.disallows.length > MAX_DISALLOWS) {
        warnings.push({
          code: 'TOO_MANY_DISALLOWS',
          path: 'disallows',
          message: `Disallows exceed recommended max (${MAX_DISALLOWS})`
        });
      }

      spec.disallows.forEach((disallow: DisallowSpec, index: number) => {
        const path = `disallows[${index}]`;
        if (!disallow.disallowId || typeof disallow.disallowId !== 'string') {
          errors.push({
            code: 'MISSING_DISALLOW_ID',
            path: `${path}.disallowId`,
            message: 'Disallow ID is required'
          });
        }
        if (!disallow.disallowedOutcome || typeof disallow.disallowedOutcome !== 'string') {
          errors.push({
            code: 'MISSING_DISALLOWED_OUTCOME',
            path: `${path}.disallowedOutcome`,
            message: 'Disallowed outcome is required'
          });
        }
        if (!Array.isArray(disallow.conditions)) {
          errors.push({
            code: 'MISSING_DISALLOW_CONDITIONS',
            path: `${path}.conditions`,
            message: 'Disallow conditions are required'
          });
        } else {
          disallow.conditions.forEach((condition, idx) => {
            errors.push(...validateCondition(condition, `${path}.conditions[${idx}]`));
          });
        }
      });
    }
  }

  return {
    ok: errors.length === 0,
    errors: errors.slice(0, 50), // Bound errors
    warnings: warnings.slice(0, 50) // Bound warnings
  };
}








































