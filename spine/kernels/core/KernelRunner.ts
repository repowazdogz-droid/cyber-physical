/**
 * KernelRunner: Core kernel execution engine.
 * Deterministic, bounded, explainable.
 */

import { KernelInput, KernelDecision, KernelResult, DecisionTrace, Claim } from './KernelTypes';
import { PolicyContext, PolicyDecision, OverrideRule, DisallowRule } from './PolicyTypes';
import { TraceBuilder } from './TraceBuilder';

/**
 * Simple deterministic hash (FNV-1a).
 */
function hashString(s: string): string {
  let hash = 2166136261;
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}

/**
 * KernelPolicy: Policy function type.
 */
export type KernelPolicy = (context: PolicyContext, trace: TraceBuilder) => PolicyDecision;

/**
 * KernelRunner: Runs kernel decision logic.
 */
export class KernelRunner {
  private policies: KernelPolicy[] = [];
  private overrideRules: OverrideRule[] = [];
  private disallowRules: DisallowRule[] = [];
  private traceBuilder: TraceBuilder = new TraceBuilder();

  /**
   * Adds a policy.
   */
  addPolicy(policy: KernelPolicy): void {
    this.policies.push(policy);
  }

  /**
   * Adds an override rule.
   */
  addOverrideRule(rule: OverrideRule): void {
    this.overrideRules.push(rule);
    // Sort by priority (higher first)
    this.overrideRules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Adds a disallow rule.
   */
  addDisallowRule(rule: DisallowRule): void {
    this.disallowRules.push(rule);
    // Sort by priority (higher first)
    this.disallowRules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Runs kernel once (single decision).
   */
  runOnce(input: KernelInput): KernelResult {
    this.traceBuilder.reset();

    // Hash input for trace
    const inputHash = this.hashInput(input);
    this.traceBuilder.addInput(
      'Kernel Input',
      `Received ${Object.keys(input.signals).length} signals`,
      { signalCount: Object.keys(input.signals).length }
    );

    // Build policy context
    const context: PolicyContext = {
      signals: input.signals,
      uncertainty: input.uncertainty,
      overrides: input.overrides || {},
      metadata: {}
    };

    // Apply override rules first (they take precedence over disallow rules)
    // Override rules are emergency escape hatches that should win
    let overrideApplied = false;
    let overrideDecision: KernelDecision | null = null;
    for (const rule of this.overrideRules) {
      if (rule.condition(context)) {
        const ruleDecision = rule.action(context);
        this.traceBuilder.addOverride(
          `Override: ${rule.type}`,
          ruleDecision.rationale,
          { overrideType: rule.type, outcome: ruleDecision.outcome ?? '' }
        );

        if (ruleDecision.outcome) {
          overrideDecision = {
            outcome: ruleDecision.outcome,
            confidence: ruleDecision.confidence,
            rationale: ruleDecision.rationale,
            assumptions: [],
            uncertainties: Object.keys(input.uncertainty).filter(k => input.uncertainty[k]),
            overridesApplied: [rule.type]
          };
          overrideApplied = true;
          break; // First matching override wins
        }
      }
    }

    // Check disallow rules (only if no override applied)
    if (!overrideApplied) {
      for (const rule of this.disallowRules) {
        if (rule.condition(context)) {
          this.traceBuilder.addPolicy(
            'Disallow Check',
            rule.reason,
            { disallowed: true, reason: rule.reason }
          );

          const decision: KernelDecision = {
            outcome: 'DISALLOWED',
            confidence: 'High',
            rationale: rule.reason,
            assumptions: [],
            uncertainties: Object.keys(input.uncertainty).filter(k => input.uncertainty[k])
          };

          const trace = this.traceBuilder.build(inputHash);
          return {
            decision,
            trace,
            timestamp: input.timestamp
          };
        }
      }
    }

    // Return override decision if one was applied
    if (overrideDecision) {
      const trace = this.traceBuilder.build(inputHash);
      return {
        decision: overrideDecision,
        trace,
        timestamp: input.timestamp
      };
    }

    // Run policies
    let finalDecision: PolicyDecision | null = null;
    for (const policy of this.policies) {
      const policyDecision = policy(context, this.traceBuilder);
      this.traceBuilder.addPolicy(
        'Policy Evaluation',
        policyDecision.rationale,
        { outcome: policyDecision.outcome ?? '', disallowed: policyDecision.disallowed }
      );

      if (policyDecision.disallowed) {
        const decision: KernelDecision = {
          outcome: 'DISALLOWED',
          confidence: policyDecision.confidence,
          rationale: policyDecision.disallowReason || policyDecision.rationale,
          assumptions: [],
          uncertainties: Object.keys(input.uncertainty).filter(k => input.uncertainty[k])
        };

        const trace = this.traceBuilder.build(inputHash);
        return {
          decision,
          trace,
          timestamp: input.timestamp
        };
      }

      if (policyDecision.outcome) {
        finalDecision = policyDecision;
        break; // First non-disallowed outcome wins
      }
    }

    // Build final decision
    if (!finalDecision || !finalDecision.outcome) {
      const decision: KernelDecision = {
        outcome: 'INDETERMINATE',
        confidence: 'Low',
        rationale: 'No policy produced an outcome',
        assumptions: [],
        uncertainties: Object.keys(input.uncertainty).filter(k => input.uncertainty[k])
      };

      const trace = this.traceBuilder.build(inputHash);
      return {
        decision,
        trace,
        timestamp: input.timestamp
      };
    }

    const decision: KernelDecision = {
      outcome: finalDecision.outcome,
      confidence: finalDecision.confidence,
      rationale: finalDecision.rationale,
      assumptions: [],
      uncertainties: Object.keys(input.uncertainty).filter(k => input.uncertainty[k]),
      overridesApplied: overrideApplied ? ['Policy'] : undefined
    };

    // Add claims
    this.traceBuilder.addClaimToTrace({
      type: 'Determinism',
      statement: 'Same input produces identical decision',
      evidence: [`Input hash: ${inputHash}`],
      confidence: 'High'
    });

    this.traceBuilder.addClaimToTrace({
      type: 'Bounded',
      statement: 'Trace length is bounded',
      evidence: [`Max nodes: 100`, `Current nodes: ${this.traceBuilder['nodeCount']}`],
      confidence: 'High'
    });

    const trace = this.traceBuilder.build(inputHash);
    return {
      decision,
      trace,
      timestamp: input.timestamp
    };
  }

  /**
   * Runs kernel over a timeline (multiple decisions).
   */
  runTimeline(inputs: KernelInput[]): KernelResult[] {
    const results: KernelResult[] = [];
    for (const input of inputs) {
      results.push(this.runOnce(input));
    }
    return results;
  }

  /**
   * Hashes input for reproducibility.
   */
  private hashInput(input: KernelInput): string {
    const serialized = JSON.stringify({
      signals: input.signals,
      uncertainty: input.uncertainty,
      overrides: input.overrides
    });
    return hashString(serialized);
  }
}

