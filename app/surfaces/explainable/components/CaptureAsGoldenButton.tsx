/**
 * Capture as Golden Button
 * 
 * Reusable component for capturing artifacts as golden test cases.
 * ND-calm, bounded, deterministic.
 * 
 * Version: 1.0.0
 */

'use client';

import React, { useState } from 'react';
import { SPACING, TEXT_SIZES } from '../../../ui/uiTokens';

const spacing = SPACING.standard;
const textSizes = TEXT_SIZES.standard;

/**
 * Maximum label length (client-side bound).
 */
const MAX_LABEL_LENGTH = 60;

/**
 * Builds golden capture payload with bounded label.
 */
export function buildGoldenCapturePayload(
  artifactId: string | null,
  defaultLabel?: string,
  runSuite?: boolean
): { artifactId: string; label?: string; runSuite?: boolean } | null {
  if (!artifactId) {
    return null;
  }

  const payload: { artifactId: string; label?: string; runSuite?: boolean } = {
    artifactId
  };

  if (defaultLabel) {
    // Bound label to max length
    payload.label = defaultLabel.length > MAX_LABEL_LENGTH
      ? defaultLabel.substring(0, MAX_LABEL_LENGTH - 3) + '...'
      : defaultLabel;
  }

  if (runSuite !== undefined) {
    payload.runSuite = runSuite;
  }

  return payload;
}

interface CaptureAsGoldenButtonProps {
  /** Artifact ID to capture (null if not available) */
  artifactId: string | null;
  /** Optional default label (will be bounded to 60 chars) */
  defaultLabel?: string;
  /** Whether to run suite after capture (default: false) */
  runSuite?: boolean;
  /** Optional custom button text */
  buttonText?: string;
  /** Optional custom styling */
  style?: React.CSSProperties;
}

export default function CaptureAsGoldenButton({
  artifactId,
  defaultLabel,
  runSuite = false,
  buttonText = 'Capture as Golden',
  style
}: CaptureAsGoldenButtonProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'already' | 'no-artifact'>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [suiteSummary, setSuiteSummary] = useState<{
    criticalCount: number;
    warnCount: number;
    totalCases: number;
  } | null>(null);

  const handleCapture = async () => {
    if (!artifactId) {
      setStatus('no-artifact');
      setStatusMessage('No artifact to capture');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setStatusMessage(null);
    setSuiteSummary(null);

    try {
      const payload = buildGoldenCapturePayload(artifactId, defaultLabel, runSuite);
      if (!payload) {
        setStatus('no-artifact');
        setStatusMessage('No artifact to capture');
        return;
      }

      const response = await fetch('/api/regression/golden/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to capture artifact');
      }

      const data = await response.json();

      if (data.added) {
        setStatus('success');
        setStatusMessage(`Added ✓ (${data.goldenSuiteCount} total cases)`);
      } else {
        setStatus('already');
        setStatusMessage('Already in suite');
      }

      // Show suite summary if runSuite was true and suite data is available
      if (runSuite && data.suite) {
        setSuiteSummary({
          criticalCount: data.suite.criticalCount || 0,
          warnCount: data.suite.warnCount || 0,
          totalCases: data.suite.totalCases || 0
        });
      }
    } catch (err: any) {
      setStatus('error');
      setStatusMessage(err.message || 'Could not capture');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (): string => {
    switch (status) {
      case 'success': return '#4caf50';
      case 'error': return '#d32f2f';
      case 'already': return '#f57c00';
      case 'no-artifact': return '#9e9e9e';
      default: return '#1976d2';
    }
  };

  const getStatusText = (): string => {
    if (statusMessage) return statusMessage;
    switch (status) {
      case 'success': return 'Added ✓';
      case 'error': return 'Could not capture';
      case 'already': return 'Already in suite';
      case 'no-artifact': return 'No artifact to capture';
      default: return '';
    }
  };

  return (
    <div style={{ marginTop: spacing.sm }}>
      <button
        onClick={handleCapture}
        disabled={loading || !artifactId}
        style={{
          padding: spacing.sm,
          fontSize: textSizes.body,
          backgroundColor: (loading || !artifactId) ? '#ccc' : getStatusColor(),
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: (loading || !artifactId) ? 'not-allowed' : 'pointer',
          ...style
        }}
      >
        {loading ? 'Capturing...' : buttonText}
      </button>

      {/* Status Message */}
      {statusMessage && status !== 'idle' && (
        <div
          style={{
            marginTop: spacing.xs,
            fontSize: textSizes.small,
            color: getStatusColor(),
            padding: spacing.xs,
            backgroundColor: status === 'success' ? '#e8f5e9' : status === 'error' ? '#ffebee' : '#fff3e0',
            borderRadius: 4
          }}
        >
          {getStatusText()}
        </div>
      )}

      {/* Suite Summary (if runSuite was true) */}
      {suiteSummary && (
        <div
          style={{
            marginTop: spacing.xs,
            fontSize: textSizes.small,
            padding: spacing.xs,
            backgroundColor: '#f5f5f5',
            borderRadius: 4
          }}
        >
          <div>Suite: {suiteSummary.totalCases} cases</div>
          {suiteSummary.criticalCount > 0 && (
            <div style={{ color: '#d32f2f' }}>
              Critical: {suiteSummary.criticalCount}
            </div>
          )}
          {suiteSummary.warnCount > 0 && (
            <div style={{ color: '#f57c00' }}>
              Warnings: {suiteSummary.warnCount}
            </div>
          )}
          {suiteSummary.criticalCount === 0 && suiteSummary.warnCount === 0 && (
            <div style={{ color: '#4caf50' }}>All good ✓</div>
          )}
        </div>
      )}
    </div>
  );
}








































