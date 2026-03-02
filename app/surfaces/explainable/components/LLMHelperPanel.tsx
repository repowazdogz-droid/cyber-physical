/**
 * LLM Helper Panel
 * 
 * Bounded, non-authoritative LLM assistance for explaining results.
 * Never changes outcomes or artifacts; only improves presentation.
 * 
 * Version: 1.0.0
 */

'use client';

import React, { useState, useEffect } from 'react';
import { SPACING, TEXT_SIZES } from '../../../ui/uiTokens';
import { UiCard } from '@/app/ui';
import { OmegaModeSelect } from '@/app/components/omega/OmegaModeSelect';
import { OmegaMetaBadge } from '@/app/components/omega/OmegaMetaBadge';
import type { OmegaMode } from '@/spine/llm/modes/OmegaModes';
import type { OmegaMeta } from '@/spine/llm/modes/OmegaMeta';

const spacing = SPACING.standard;
const textSizes = TEXT_SIZES.standard;

interface LLMHelperPanelProps {
  disabledReason?: string;
  kind: 'kernelRun' | 'orchestratorRun' | 'regressionDiff' | 'questions';
  payload: any;
  title?: string;
}

type HelperStatus = 'idle' | 'running' | 'disabled' | 'error';
type HelperMode = 'bullets' | 'plain' | 'questions';

const MAX_PAYLOAD_SIZE = 8000; // 8KB

export default function LLMHelperPanel({
  disabledReason,
  kind,
  payload,
  title = 'AI Helper'
}: LLMHelperPanelProps) {
  const [status, setStatus] = useState<HelperStatus>(disabledReason ? 'disabled' : 'idle');
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [geminiEnabled, setGeminiEnabled] = useState<boolean | null>(null);
  const [omegaMode, setOmegaMode] = useState<OmegaMode | "">("");
  const [omegaMeta, setOmegaMeta] = useState<OmegaMeta | undefined>(undefined);

  // Load omegaMode from localStorage on mount
  useEffect(() => {
    const saved = window.localStorage.getItem("omegaMode");
    if (saved) setOmegaMode(saved as OmegaMode | "");
  }, []);

  // Persist omegaMode to localStorage
  useEffect(() => {
    if (omegaMode) window.localStorage.setItem("omegaMode", omegaMode);
    else window.localStorage.removeItem("omegaMode");
  }, [omegaMode]);

  // Check Gemini status on mount
  useEffect(() => {
    async function checkStatus() {
      try {
        const response = await fetch('/api/llm/status');
        if (response.ok) {
          const data = await response.json();
          setGeminiEnabled(data.enabled);
          if (!data.enabled) {
            setStatus('disabled');
          }
        }
      } catch (err) {
        // Assume disabled if check fails
        setGeminiEnabled(false);
        setStatus('disabled');
      }
    }
    checkStatus();
  }, []);

  // Check payload size
  useEffect(() => {
    const payloadJson = JSON.stringify(payload);
    if (payloadJson.length > MAX_PAYLOAD_SIZE) {
      setError('Too large to explain safely.');
      setStatus('error');
    }
  }, [payload]);

  const handleExplain = async (mode: HelperMode) => {
    if (status === 'disabled' || !geminiEnabled) {
      return;
    }

    setStatus('running');
    setError(null);
    setOutput([]);
    setOmegaMeta(undefined);
    setIsExpanded(true);

    try {
      const body: any = { kind, payload, mode };
      if (omegaMode) body.omegaMode = omegaMode;

      const response = await fetch('/api/llm/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!data.ok) {
        if (data.error === 'LLM_DISABLED') {
          setStatus('disabled');
          setError('LLM assist is disabled on this build.');
        } else {
          setStatus('error');
          setError(data.error || 'Failed to generate explanation');
        }
        setOmegaMeta(undefined);
        return;
      }

      // Capture omegaMeta if present
      setOmegaMeta(data.omegaMeta);

      // Bound output
      if (mode === 'questions') {
        const questions = data.questions || [];
        setOutput(questions.slice(0, 5).map((q: string) => q.substring(0, 120)));
      } else {
        const bullets = data.bullets || [];
        // Bound to 8 bullets, 900 chars total
        let totalChars = 0;
        const bounded: string[] = [];
        for (const bullet of bullets.slice(0, 8)) {
          const boundedBullet = bullet.substring(0, 200);
          if (totalChars + boundedBullet.length > 900) {
            break;
          }
          bounded.push(boundedBullet);
          totalChars += boundedBullet.length;
        }
        setOutput(bounded);
      }

      setStatus('idle');
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Failed to generate explanation');
    }
  };

  const isDisabled: boolean = status === 'disabled' || !geminiEnabled || !!disabledReason;

  return (
    <UiCard style={{ marginTop: spacing.md }}>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isExpanded ? spacing.sm : 0
        }}
      >
        <h3 style={{ fontSize: textSizes.h3, margin: 0 }}>
          {title} {isExpanded ? '▼' : '▶'}
        </h3>
      </div>

      {isExpanded && (
        <div>
          {disabledReason && (
            <div style={{
              padding: spacing.sm,
              backgroundColor: '#f5f5f5',
              borderRadius: 4,
              marginBottom: spacing.sm,
              fontSize: textSizes.small,
              color: '#6a6a6a'
            }}>
              {disabledReason}
            </div>
          )}

          {!disabledReason && (
            <div>
              <div style={{ marginBottom: spacing.sm }}>
                <OmegaModeSelect value={omegaMode} onChange={setOmegaMode} />
              </div>
              <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.sm }}>
                {kind !== 'questions' && (
                <>
                  <button
                    onClick={() => handleExplain('bullets')}
                    disabled={!!isDisabled || status === 'running'}
                    style={{
                      padding: spacing.xs,
                      fontSize: textSizes.small,
                      backgroundColor: (!!isDisabled || status === 'running') ? '#ccc' : '#1976d2',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: (!!isDisabled || status === 'running') ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Explain in 3 bullets
                  </button>
                  <button
                    onClick={() => handleExplain('plain')}
                    disabled={!!isDisabled || status === 'running'}
                    style={{
                      padding: spacing.xs,
                      fontSize: textSizes.small,
                      backgroundColor: (!!isDisabled || status === 'running') ? '#ccc' : '#1976d2',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: (!!isDisabled || status === 'running') ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Explain for non-technical
                  </button>
                </>
              )}
              <button
                onClick={() => handleExplain('questions')}
                disabled={isDisabled || status === 'running'}
                style={{
                  padding: spacing.xs,
                  fontSize: textSizes.small,
                  backgroundColor: (isDisabled || status === 'running') ? '#ccc' : '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: (isDisabled || status === 'running') ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                Generate 5 smart questions
              </button>
              </div>
            </div>
          )}

          {status === 'running' && (
            <div style={{ fontSize: textSizes.small, color: '#1976d2', marginBottom: spacing.sm }}>
              Generating...
            </div>
          )}

          {error && (
            <div style={{
              padding: spacing.sm,
              backgroundColor: '#ffebee',
              borderRadius: 4,
              marginBottom: spacing.sm,
              fontSize: textSizes.small,
              color: '#d32f2f'
            }}>
              {error}
            </div>
          )}

          {output.length > 0 && (
            <div style={{
              padding: spacing.sm,
              backgroundColor: '#f5f5f5',
              borderRadius: 4,
              fontSize: textSizes.small
            }}>
              {kind === 'questions' ? (
                <ul style={{ margin: 0, paddingLeft: spacing.md }}>
                  {output.map((q, idx) => (
                    <li key={idx} style={{ marginBottom: spacing.xs }}>
                      {q}
                    </li>
                  ))}
                </ul>
              ) : (
                <ul style={{ margin: 0, paddingLeft: spacing.md }}>
                  {output.map((bullet, idx) => (
                    <li key={idx} style={{ marginBottom: spacing.xs }}>
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
              <OmegaMetaBadge omega={omegaMeta} />
            </div>
          )}
        </div>
      )}
    </UiCard>
  );
}

