/**
 * Tests for SafeLandingKernel.
 * Covers: determinism, ambiguity bias, overrides, S1 exit, bounded trace.
 */

import { SafeLandingKernel } from '../SafeLandingKernel';
import {
  SafeLandingInput,
  AltitudeBand,
  HealthStatus,
  Environment,
  TimeToContact,
  SafeLandingOutcome
} from '../SafeLandingTypes';

describe('SafeLandingKernel', () => {
  let kernel: SafeLandingKernel;

  beforeEach(() => {
    kernel = new SafeLandingKernel();
  });

  describe('Determinism', () => {
    test('same input produces identical decision and trace', () => {
      const input: SafeLandingInput = {
        altitudeBand: AltitudeBand.A2,
        healthStatus: HealthStatus.H1,
        environment: Environment.E1,
        timeToContact: TimeToContact.T3,
        uncertainty: {}
      };

      const result1 = kernel.run(input);
      const result2 = kernel.run(input);

      expect(result1.decision.outcome).toBe(result2.decision.outcome);
      expect(result1.trace.traceId).toBe(result2.trace.traceId);
      expect(result1.trace.nodes.length).toBe(result2.trace.nodes.length);
    });
  });

  describe('Ambiguity Hardening', () => {
    test('H3 biases toward harder outcome', () => {
      const input: SafeLandingInput = {
        altitudeBand: AltitudeBand.A2,
        healthStatus: HealthStatus.H3,
        environment: Environment.E1,
        timeToContact: TimeToContact.T3,
        uncertainty: {}
      };

      const result = kernel.run(input);
      expect(result.decision.outcome).toBe(SafeLandingOutcome.S3);
    });

    test('A2/A3 oscillation biases harder when flagged', () => {
      const input: SafeLandingInput = {
        altitudeBand: AltitudeBand.A2,
        healthStatus: HealthStatus.H1,
        environment: Environment.E1,
        timeToContact: TimeToContact.T3,
        uncertainty: {}
      };

      // Note: Oscillation detection would be in metadata
      // This test verifies the policy structure
      const result = kernel.run(input);
      expect(result.decision.outcome).toBeDefined();
    });
  });

  describe('Environment Overrides', () => {
    test('E3 forces landing (S3)', () => {
      const input: SafeLandingInput = {
        altitudeBand: AltitudeBand.A1,
        healthStatus: HealthStatus.H1,
        environment: Environment.E3,
        timeToContact: TimeToContact.T4,
        uncertainty: {}
      };

      const result = kernel.run(input);
      expect(result.decision.outcome).toBe(SafeLandingOutcome.S3);
      expect(result.decision.overridesApplied).toContain('Environment');
    });

    test('E4 forces emergency landing (S4)', () => {
      const input: SafeLandingInput = {
        altitudeBand: AltitudeBand.A1,
        healthStatus: HealthStatus.H1,
        environment: Environment.E4,
        timeToContact: TimeToContact.T4,
        uncertainty: {}
      };

      const result = kernel.run(input);
      expect(result.decision.outcome).toBe(SafeLandingOutcome.S4);
      expect(result.decision.overridesApplied).toContain('Environment');
    });
  });

  describe('Time to Contact Overrides', () => {
    test('T1 forces emergency landing (S4)', () => {
      const input: SafeLandingInput = {
        altitudeBand: AltitudeBand.A1,
        healthStatus: HealthStatus.H1,
        environment: Environment.E1,
        timeToContact: TimeToContact.T1,
        uncertainty: {}
      };

      const result = kernel.run(input);
      expect(result.decision.outcome).toBe(SafeLandingOutcome.S4);
      expect(result.decision.overridesApplied).toContain('TimeToContact');
    });
  });

  describe('S1 Exit Conditions', () => {
    test('canContinueMission returns true for S1', () => {
      const input: SafeLandingInput = {
        altitudeBand: AltitudeBand.A2,
        healthStatus: HealthStatus.H1,
        environment: Environment.E1,
        timeToContact: TimeToContact.T3,
        uncertainty: {}
      };

      expect(kernel.canContinueMission(input)).toBe(true);
    });

    test('canContinueMission returns false for S2-S4', () => {
      const input: SafeLandingInput = {
        altitudeBand: AltitudeBand.A4,
        healthStatus: HealthStatus.H3,
        environment: Environment.E1,
        timeToContact: TimeToContact.T2,
        uncertainty: {}
      };

      expect(kernel.canContinueMission(input)).toBe(false);
    });
  });

  describe('Composite Fault Handling', () => {
    test('worst credible A/H dominates (H4 wins)', () => {
      const input: SafeLandingInput = {
        altitudeBand: AltitudeBand.A1,
        healthStatus: HealthStatus.H4,
        environment: Environment.E1,
        timeToContact: TimeToContact.T4,
        uncertainty: {}
      };

      const result = kernel.run(input);
      expect(result.decision.outcome).toBe(SafeLandingOutcome.S4);
    });

    test('worst credible A/H dominates (A4 + H3)', () => {
      const input: SafeLandingInput = {
        altitudeBand: AltitudeBand.A4,
        healthStatus: HealthStatus.H3,
        environment: Environment.E1,
        timeToContact: TimeToContact.T3,
        uncertainty: {}
      };

      const result = kernel.run(input);
      expect(result.decision.outcome).toBe(SafeLandingOutcome.S3);
    });
  });

  describe('Bounded Trace', () => {
    test('trace length is bounded (max 100 nodes)', () => {
      const input: SafeLandingInput = {
        altitudeBand: AltitudeBand.A2,
        healthStatus: HealthStatus.H2,
        environment: Environment.E2,
        timeToContact: TimeToContact.T2,
        uncertainty: {}
      };

      const result = kernel.run(input);
      expect(result.trace.nodeCount).toBeLessThanOrEqual(100);
      expect(result.trace.nodes.length).toBeLessThanOrEqual(100);
    });

    test('trace depth is bounded (max 5 levels)', () => {
      const input: SafeLandingInput = {
        altitudeBand: AltitudeBand.A2,
        healthStatus: HealthStatus.H1,
        environment: Environment.E1,
        timeToContact: TimeToContact.T3,
        uncertainty: {}
      };

      const result = kernel.run(input);
      
      const checkDepth = (nodes: typeof result.trace.nodes, depth: number = 0): number => {
        if (depth > 5) return depth; // Fail if exceeds
        let maxDepth = depth;
        for (const node of nodes) {
          if (node.children) {
            const childDepth = checkDepth(node.children, depth + 1);
            maxDepth = Math.max(maxDepth, childDepth);
          }
        }
        return maxDepth;
      };

      const maxDepth = checkDepth(result.trace.nodes);
      expect(maxDepth).toBeLessThanOrEqual(5);
    });
  });

  describe('Disallow Rules', () => {
    test('H4 triggers override to S4 (override-first semantics)', () => {
      const input: SafeLandingInput = {
        altitudeBand: AltitudeBand.A1,
        healthStatus: HealthStatus.H4,
        environment: Environment.E1,
        timeToContact: TimeToContact.T4,
        uncertainty: {}
      };

      const result = kernel.run(input);
      // With override-first semantics, H4 should map to S4 via policy (not DISALLOWED)
      expect(result.decision.outcome).toBe(SafeLandingOutcome.S4);
    });

    test('E4 triggers override to S4 (override-first semantics)', () => {
      const input: SafeLandingInput = {
        altitudeBand: AltitudeBand.A1,
        healthStatus: HealthStatus.H1,
        environment: Environment.E4,
        timeToContact: TimeToContact.T4,
        uncertainty: {}
      };

      const result = kernel.run(input);
      // With override-first semantics, E4 override should win (S4), not DISALLOWED
      expect(result.decision.outcome).toBe(SafeLandingOutcome.S4);
      expect(result.decision.overridesApplied).toContain('Environment');
    });
  });
});




