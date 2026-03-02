/**
 * Integrity Panel
 * 
 * Collapsible "Integrity & Replay" section for recap pages.
 * Shows verification status and checks.
 * 
 * Version: 1.0.0
 */

import React, { useState } from 'react';
import { SPACING, TEXT_SIZES } from '../../../ui/uiTokens';
import UiCard from '../../../ui/UiCard';
import { ReplayVerificationResult } from '../../../../spine/verifier/ReplayVerifierTypes';

const spacing = SPACING.standard;
const textSizes = TEXT_SIZES.standard;

interface IntegrityPanelProps {
  sessionId: string;
}

export default function IntegrityPanel({ sessionId }: IntegrityPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReplayVerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/verify/bundle/${sessionId}`);
      if (!response.ok) {
        throw new Error('Verification failed');
      }
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to verify bundle');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!result) return '⚪';
    if (result.ok) return '✅';
    return '⚠️';
  };

  const getStatusText = () => {
    if (!result) return 'Not verified';
    if (result.ok) return 'Verified';
    return 'Verification issues';
  };

  return (
    <UiCard style={{ marginBottom: spacing.lg }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          padding: spacing.md,
          fontSize: textSizes.body,
          backgroundColor: 'transparent',
          border: '1px solid #ccc',
          borderRadius: 4,
          cursor: 'pointer',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span>
          {getStatusIcon()} Integrity & Replay {result && `(${result.checks.length} checks)`}
        </span>
        <span>{expanded ? '▼' : '▶'}</span>
      </button>

      {expanded && (
        <div style={{ marginTop: spacing.md }}>
          {!result && (
            <div style={{ marginBottom: spacing.md }}>
              <p style={{ fontSize: textSizes.body, marginBottom: spacing.sm }}>
                Verify bundle integrity and determinism.
              </p>
              <button
                onClick={handleVerify}
                disabled={loading}
                style={{
                  padding: spacing.sm,
                  fontSize: textSizes.body,
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Verifying...' : 'Run Verification'}
              </button>
            </div>
          )}

          {error && (
            <div style={{
              padding: spacing.sm,
              backgroundColor: '#ffebee',
              borderRadius: 4,
              marginBottom: spacing.sm
            }}>
              <p style={{ fontSize: textSizes.small, color: '#d32f2f' }}>{error}</p>
            </div>
          )}

          {result && (
            <div>
              <div style={{
                padding: spacing.sm,
                backgroundColor: result.ok ? '#e8f5e9' : '#fff3e0',
                borderRadius: 4,
                marginBottom: spacing.md
              }}>
                <p style={{ fontSize: textSizes.body, fontWeight: 'bold', margin: '0 0 ' + spacing.xs + ' 0' }}>
                  Status: {getStatusText()}
                </p>
                <p style={{ fontSize: textSizes.small, margin: 0, opacity: 0.7 }}>
                  Verified at: {new Date(result.verifiedAtIso).toLocaleString()}
                </p>
              </div>

              {result.checks.length > 0 && (
                <div style={{ marginBottom: spacing.md }}>
                  <h4 style={{ fontSize: textSizes.body, fontWeight: 'bold', margin: '0 0 ' + spacing.xs + ' 0' }}>
                    Checks ({result.checks.length})
                  </h4>
                  {result.checks.slice(0, 6).map((check, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: spacing.xs,
                        marginBottom: spacing.xs,
                        backgroundColor: check.ok ? '#f1f8e9' : '#ffebee',
                        borderRadius: 4,
                        borderLeft: `3px solid ${check.ok ? '#4caf50' : '#d32f2f'}`
                      }}
                    >
                      <p style={{ fontSize: textSizes.small, fontWeight: 'bold', margin: '0 0 ' + spacing.xs + ' 0' }}>
                        {check.ok ? '✅' : '❌'} {check.id}
                      </p>
                      {check.detail && (
                        <p style={{ fontSize: textSizes.small, margin: 0, opacity: 0.7 }}>
                          {check.detail}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {result.notes.length > 0 && (
                <div>
                  <h4 style={{ fontSize: textSizes.body, fontWeight: 'bold', margin: '0 0 ' + spacing.xs + ' 0' }}>
                    Notes ({result.notes.length})
                  </h4>
                  {result.notes.slice(0, 3).map((note, idx) => (
                    <p key={idx} style={{ fontSize: textSizes.small, margin: spacing.xs + ' 0', paddingLeft: spacing.sm }}>
                      • {note}
                    </p>
                  ))}
                </div>
              )}

              <button
                onClick={handleVerify}
                disabled={loading}
                style={{
                  marginTop: spacing.md,
                  padding: spacing.sm,
                  fontSize: textSizes.small,
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Verifying...' : 'Re-verify'}
              </button>
            </div>
          )}
        </div>
      )}
    </UiCard>
  );
}








































