/**
 * Regression Page
 * 
 * UI for running golden suite and viewing results.
 * ND-first: no giant JSON dumps.
 * 
 * Version: 1.0.0
 */

'use client';

import React, { useState } from 'react';
import { SPACING, TEXT_SIZES } from '../ui/uiTokens';
import { UiCard } from '@/app/ui';
import LLMHelperPanel from '../surfaces/explainable/components/LLMHelperPanel';
import { buildRegressionDiffPayload } from '../surfaces/explainable/llmPayloadBuilder';

const spacing = SPACING.standard;
const textSizes = TEXT_SIZES.standard;

interface GoldenSuiteResult {
  ok: boolean;
  totals: {
    totalCases: number;
    passedCases: number;
    failedCases: number;
  };
  criticalCount: number;
  warnCount: number;
  infoCount: number;
  results: Array<{
    artifactId: string;
    label: string;
    ok: boolean;
    findings: Array<{
      severity: 'info' | 'warn' | 'critical';
      path: string;
      before: string;
      after: string;
      hint?: string;
    }>;
    error?: string;
  }>;
}

export default function RegressionPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GoldenSuiteResult | null>(null);
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set());

  const handleRunSuite = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/regression/golden');
      if (!response.ok) {
        throw new Error('Failed to run golden suite');
      }

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      console.error('Failed to run golden suite:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCase = (artifactId: string) => {
    const newExpanded = new Set(expandedCases);
    if (newExpanded.has(artifactId)) {
      newExpanded.delete(artifactId);
    } else {
      newExpanded.add(artifactId);
    }
    setExpandedCases(newExpanded);
  };

  return (
    <div style={{ padding: spacing.md, maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ fontSize: textSizes.h1, marginBottom: spacing.md }}>
        Regression Testing
      </h1>

      {/* Run button */}
      <UiCard style={{ marginBottom: spacing.lg }}>
        <button
          onClick={handleRunSuite}
          disabled={loading}
          style={{
            padding: spacing.md,
            fontSize: textSizes.body,
            backgroundColor: loading ? '#ccc' : '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer',
            width: '100%'
          }}
        >
          {loading ? 'Running...' : 'Run Golden Suite'}
        </button>
      </UiCard>

      {/* Results */}
      {result && (
        <>
          {/* Summary */}
          <UiCard style={{ marginBottom: spacing.lg }}>
            <div style={{ display: 'flex', gap: spacing.md, alignItems: 'center', marginBottom: spacing.sm }}>
              <span style={{
                fontSize: textSizes.h2,
                fontWeight: 'bold',
                color: result.ok ? '#4caf50' : '#d32f2f'
              }}>
                {result.ok ? '✅ Passed' : '❌ Failed'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: spacing.lg, flexWrap: 'wrap' }}>
              <div>
                <strong>Total cases:</strong> {result.totals.totalCases}
              </div>
              <div>
                <strong>Passed:</strong> {result.totals.passedCases}
              </div>
              <div>
                <strong>Failed:</strong> {result.totals.failedCases}
              </div>
              <div style={{ color: '#d32f2f' }}>
                <strong>Critical:</strong> {result.criticalCount}
              </div>
              <div style={{ color: '#f57c00' }}>
                <strong>Warnings:</strong> {result.warnCount}
              </div>
              <div style={{ color: '#1976d2' }}>
                <strong>Info:</strong> {result.infoCount}
              </div>
            </div>
          </UiCard>

          {/* LLM Helper for Overall Summary */}
          {result && (() => {
            const topChanged = result.results
              .filter(r => !r.ok && r.findings.length > 0)
              .flatMap(r => r.findings.slice(0, 3))
              .slice(0, 8)
              .map(f => ({
                severity: f.severity,
                path: f.path,
                message: f.hint || `${f.before} → ${f.after}`
              }));
            
            const payload = buildRegressionDiffPayload({
              label: `Regression suite: ${result.totals.passedCases}/${result.totals.totalCases} passed`,
              criticalCount: result.criticalCount,
              warnCount: result.warnCount,
              topChanged
            });
            
            return (
              <LLMHelperPanel
                kind="regressionDiff"
                payload={payload}
                title="AI Helper: Explain Drift"
              />
            );
          })()}

          {/* Per-case results */}
          {result.results.map((caseResult) => {
            const isExpanded = expandedCases.has(caseResult.artifactId);
            const hasFindings = caseResult.findings.length > 0;

            return (
              <UiCard key={caseResult.artifactId} style={{ marginBottom: spacing.md }}>
                <div
                  onClick={() => toggleCase(caseResult.artifactId)}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: hasFindings || caseResult.error ? spacing.sm : 0
                  }}
                >
                  <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
                    <span style={{ fontSize: textSizes.body }}>
                      {caseResult.ok ? '✅' : '❌'}
                    </span>
                    <span style={{ fontSize: textSizes.body, fontWeight: 'bold' }}>
                      {caseResult.label}
                    </span>
                  </div>
                  {(hasFindings || caseResult.error) && (
                    <span style={{ fontSize: textSizes.small, opacity: 0.7 }}>
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  )}
                </div>

                {isExpanded && (
                  <div style={{ marginTop: spacing.sm, paddingTop: spacing.sm, borderTop: '1px solid #eee' }}>
                    {caseResult.error && (
                      <div style={{
                        padding: spacing.sm,
                        backgroundColor: '#ffebee',
                        borderRadius: 4,
                        marginBottom: spacing.sm
                      }}>
                        <strong>Error:</strong> {caseResult.error}
                      </div>
                    )}

                    {hasFindings && (
                      <div>
                        <strong>Findings ({caseResult.findings.length}):</strong>
                        {caseResult.findings.slice(0, 10).map((finding, idx) => {
                          const severityColor = finding.severity === 'critical' ? '#d32f2f' :
                                                finding.severity === 'warn' ? '#f57c00' : '#1976d2';
                          return (
                            <div
                              key={idx}
                              style={{
                                padding: spacing.sm,
                                marginTop: spacing.xs,
                                backgroundColor: '#f5f5f5',
                                borderRadius: 4,
                                fontSize: textSizes.small
                              }}
                            >
                              <div style={{ color: severityColor, fontWeight: 'bold' }}>
                                {finding.severity.toUpperCase()}: {finding.path}
                              </div>
                              {finding.hint && (
                                <div style={{ opacity: 0.7, marginTop: 2 }}>
                                  {finding.hint}
                                </div>
                              )}
                              {finding.before && (
                                <div style={{ marginTop: 4 }}>
                                  <strong>Before:</strong> {finding.before}
                                </div>
                              )}
                              {finding.after && (
                                <div style={{ marginTop: 2 }}>
                                  <strong>After:</strong> {finding.after}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {caseResult.findings.length > 10 && (
                          <div style={{ marginTop: spacing.sm, fontSize: textSizes.small, opacity: 0.7 }}>
                            ... and {caseResult.findings.length - 10} more findings
                          </div>
                        )}
                      </div>
                    )}

                    {/* LLM Helper for this case */}
                    {hasFindings && (() => {
                      const topChanged = caseResult.findings
                        .slice(0, 8)
                        .map(f => ({
                          severity: f.severity,
                          path: f.path,
                          message: f.hint || `${f.before} → ${f.after}`
                        }));
                      
                      const payload = buildRegressionDiffPayload({
                        label: caseResult.label,
                        criticalCount: caseResult.findings.filter(f => f.severity === 'critical').length,
                        warnCount: caseResult.findings.filter(f => f.severity === 'warn').length,
                        topChanged
                      });
                      
                      return (
                        <div style={{ marginTop: spacing.md }}>
                          <LLMHelperPanel
                            kind="regressionDiff"
                            payload={payload}
                            title="AI Helper: Explain This Case"
                          />
                        </div>
                      );
                    })()}
                  </div>
                )}
              </UiCard>
            );
          })}
        </>
      )}
    </div>
  );
}


