'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SPACING, MAX_LINE_WIDTH, TEXT_SIZES, TAP_MIN_PX } from '../../learning/ui/uiTokens';

// Use standard spacing values
const spacing = SPACING.standard;
const textSizes = TEXT_SIZES.standard;
import UiCard from '../../learning/ui/UiCard';
import { UAV_PRESETS, UAVPreset } from './presets';
import { appendThoughtObjectsToBoard } from '../../learning/persist/LearningPersist';
import ExplainablePanel from '../../surfaces/explainable/ExplainablePanel';
import CaptureAsGoldenButton from '../../surfaces/explainable/components/CaptureAsGoldenButton';
import LLMHelperPanel from '../../surfaces/explainable/components/LLMHelperPanel';
import { buildFromKernelRun } from '../../surfaces/explainable/ExplainableModelBuilder';
import { buildExplainablePayload } from '../../surfaces/explainable/llmPayloadBuilder';

interface KernelRunResult {
  ok: boolean;
  run: {
    runId: string;
    kernelId: string;
    adapterId: string;
    createdAtIso?: string;
    inputHash?: string;
    decision: {
      outcomeId: string;
      label: string;
      confidence: string;
      rationale: string;
    };
    claims: Array<{
      id: string;
      type: string;
      text: string;
    }>;
    trace: Array<{
      id: string;
      type: string;
      label: string;
      description: string;
      timestamp: string;
    }>;
  };
  thoughtObjects?: Array<{
    id: string;
    type: string;
    content: string | { title: string; body: string };
    source: string;
    timestamp: string;
    confidence?: string;
  }>;
  policyNotes?: string[];
  adapterDiagnostics?: {
    issues: Array<{
      signalKey: string;
      severity: "info" | "warn" | "critical";
      message: string;
    }>;
    uncertaintyFlags: Array<{
      signalKey: string;
      reason: string;
      level: "low" | "medium" | "high";
    }>;
    confidenceHint?: string;
  };
}

export default function UAVKernelsPage() {
  const router = useRouter();
  const [selectedPreset, setSelectedPreset] = useState<UAVPreset | null>(null);
  const [learnerId, setLearnerId] = useState('demo-uav');
  const [sessionId, setSessionId] = useState('');
  const [persist, setPersist] = useState(true);
  const [attachToBoard, setAttachToBoard] = useState(true);
  const [policyPackId, setPolicyPackId] = useState('uav_safety_conservative');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<KernelRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [boardSent, setBoardSent] = useState(false);
  const [includeAdapterDiagnostics, setIncludeAdapterDiagnostics] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [lastArtifactId, setLastArtifactId] = useState<string | null>(null);

  const handleRun = async (preset: UAVPreset) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setBoardSent(false);

    try {
      const response = await fetch('/api/kernels/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learnerId: learnerId || undefined,
          sessionId: sessionId || undefined,
          adapterId: 'uav_safe_landing',
          kernelId: 'safe_landing_decision_square_v2_3',
          input: preset.input,
          persist: persist && !!learnerId,
          attachToBoard: attachToBoard && !!learnerId,
          policyPackId: policyPackId || undefined,
          includeAdapterDiagnostics: includeAdapterDiagnostics
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Calm error handling - show result card with error state
        setResult({
          ok: false,
          run: {
            runId: 'error',
            kernelId: 'uav_safe_landing',
            adapterId: 'uav_safe_landing',
            createdAtIso: new Date().toISOString(),
            inputHash: '',
            decision: {
              outcomeId: 'ERROR',
              label: 'Unable to run kernel',
              confidence: 'Unknown',
              rationale: errorData.error || 'Failed to run kernel. Please check your inputs and try again.'
            },
            claims: [],
            trace: []
          },
          thoughtObjects: []
        });
        setSelectedPreset(preset);
        return;
      }

      const data = await response.json();
      // Ensure run has required fields
      if (data.run) {
        const safeRun = {
          ...data.run,
          createdAtIso: data.run.createdAtIso ?? new Date().toISOString(),
          inputHash: data.run.inputHash ?? ""
        };
        setResult({
          ...data,
          run: safeRun
        });
      } else {
        setResult(data);
      }
      setSelectedPreset(preset);
      
      // Track artifactId if run was persisted
      if (data.run?.runId && persist && learnerId) {
        setLastArtifactId(data.run.runId);
      }
    } catch (err: any) {
      // Calm error handling - show result card with error state
        setResult({
          ok: false,
          run: {
            runId: 'error',
            kernelId: 'uav_safe_landing',
            adapterId: 'uav_safe_landing',
            createdAtIso: new Date().toISOString(),
            inputHash: '',
            decision: {
              outcomeId: 'ERROR',
              label: 'Unable to run kernel',
              confidence: 'Unknown',
              rationale: err.message || 'Failed to run kernel. Please check your connection and try again.'
            },
            claims: [],
            trace: []
          },
          thoughtObjects: []
        });
    } finally {
      setLoading(false);
    }
  };

  const handleSendToBoard = async () => {
    if (!result || !result.thoughtObjects || result.thoughtObjects.length === 0) {
      setError('No thought objects to send');
      return;
    }

    try {
      await appendThoughtObjectsToBoard(result.thoughtObjects, sessionId || undefined);
      setBoardSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send to board');
    }
  };

  const handlePairToXR = () => {
    router.push('/pair?mode=uav-demo');
  };

  const handleExportArtifact = async () => {
    if (!result || !result.run) {
      setError('No run result to export');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Export as artifact using putArtifact API
      const response = await fetch('/api/artifacts/put', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'KERNEL_RUN',
          payloads: {
            run: result.run
          },
          meta: {
            artifactId: result.run.runId,
            learnerId: learnerId || undefined,
            sessionId: sessionId || undefined,
            notes: 'Exported from UAV page'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to export artifact');
      }

      const data = await response.json();
      setLastArtifactId(data.artifactId);
    } catch (err: any) {
      setError(err.message || 'Failed to export artifact');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: spacing.md, maxWidth: MAX_LINE_WIDTH, margin: '0 auto' }}>
      <h1 style={{ fontSize: textSizes.h1, marginBottom: spacing.sm }}>
        UAV Safe Landing — Assurance-First Decision Kernel
      </h1>

      <p style={{ fontSize: textSizes.body, marginBottom: spacing.lg, opacity: 0.7 }}>
        Run decision kernel with curated presets. Results can be sent to Learning Board or paired to Vision Pro.
      </p>

      {/* Policy Pack Selector */}
      <UiCard style={{ marginBottom: spacing.lg }}>
        <label style={{ display: 'block', marginBottom: spacing.sm, fontSize: textSizes.body }}>
          Policy Pack
        </label>
        <select
          value={policyPackId}
          onChange={(e) => setPolicyPackId(e.target.value)}
          style={{
            width: '100%',
            padding: spacing.sm,
            fontSize: textSizes.body,
            border: '1px solid #ccc',
            borderRadius: 4
          }}
        >
          <option value="uav_safety_conservative">UAV Safety Conservative</option>
          <option value="learning_privacy_default">Learning Privacy Default</option>
          <option value="xr_comfort_default">XR Comfort Default</option>
        </select>
      </UiCard>

      {/* Preset Picker */}
      <UiCard style={{ marginBottom: spacing.lg }}>
        <h2 style={{ fontSize: textSizes.h2, marginBottom: spacing.md }}>
          Choose Scenario
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.md }}>
          {UAV_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleRun(preset)}
              disabled={loading}
              style={{
                padding: spacing.md,
                fontSize: textSizes.body,
                backgroundColor: selectedPreset?.id === preset.id ? '#e3f2fd' : '#f5f5f5',
                border: selectedPreset?.id === preset.id ? '2px solid #1976d2' : '1px solid #ccc',
                borderRadius: 4,
                cursor: loading ? 'not-allowed' : 'pointer',
                minHeight: TAP_MIN_PX,
                textAlign: 'left'
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: spacing.sm }}>
                {preset.title}
              </div>
              <div style={{ fontSize: textSizes.small, opacity: 0.7 }}>
                {preset.whatHappening}
              </div>
            </button>
          ))}
        </div>
      </UiCard>

      {/* Action Buttons */}
      {result && (
        <UiCard style={{ marginBottom: spacing.lg }}>
          <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap' }}>
            <button
              onClick={handleSendToBoard}
              disabled={!learnerId || !result.thoughtObjects || result.thoughtObjects.length === 0 || boardSent}
              style={{
                padding: spacing.md,
                fontSize: textSizes.body,
                backgroundColor: boardSent ? '#4caf50' : (!learnerId ? '#ccc' : '#1976d2'),
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: (!learnerId || !result.thoughtObjects || result.thoughtObjects.length === 0 || boardSent) ? 'not-allowed' : 'pointer',
                minHeight: TAP_MIN_PX,
                flex: 1,
                minWidth: 150
              }}
              title={!learnerId ? 'To send to board, add learnerId in Advanced options' : undefined}
            >
              {boardSent ? '✓ Sent to Board' : (!learnerId ? 'Add learnerId to send' : 'Send to Board')}
            </button>
            <button
              onClick={handlePairToXR}
              style={{
                padding: spacing.md,
                fontSize: textSizes.body,
                backgroundColor: '#f5f5f5',
                border: '1px solid #ccc',
                borderRadius: 4,
                cursor: 'pointer',
                minHeight: TAP_MIN_PX,
                flex: 1,
                minWidth: 150
              }}
            >
              Pair to Vision Pro
            </button>
            <button
              onClick={handleExportArtifact}
              disabled={loading || !result}
              style={{
                padding: spacing.md,
                fontSize: textSizes.body,
                backgroundColor: loading || !result ? '#ccc' : '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: loading || !result ? 'not-allowed' : 'pointer',
                minHeight: TAP_MIN_PX,
                flex: 1,
                minWidth: 150
              }}
            >
              Export Artifact
            </button>
          </div>
        </UiCard>
      )}

      {/* Error */}
      {error && (
        <UiCard style={{ marginBottom: spacing.lg, backgroundColor: '#ffebee' }}>
          <p style={{ color: '#d32f2f', fontSize: textSizes.body }}>{error}</p>
        </UiCard>
      )}

      {/* Output Area */}
      {result && (
        <>
          {/* Copy Recap Link (if sessionId exists) */}
          {result.run && sessionId && (
            <UiCard style={{ marginBottom: spacing.lg }}>
              <button
                onClick={() => {
                  const recapUrl = `${window.location.origin}/learning/recap/${sessionId}`;
                  navigator.clipboard.writeText(recapUrl);
                  alert('Recap link copied to clipboard!');
                }}
                style={{
                  padding: spacing.md,
                  fontSize: textSizes.body,
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  cursor: 'pointer',
                  width: '100%',
                  minHeight: TAP_MIN_PX
                }}
              >
                📋 Copy Recap Link
              </button>
            </UiCard>
          )}

          {/* Explainable Panel */}
          <UiCard style={{ marginBottom: spacing.lg }}>
            <h2 style={{ fontSize: textSizes.h2, marginBottom: spacing.md }}>
              Decision Outcome
            </h2>
            <ExplainablePanel
              mode="kernel"
              run={result.run as any}
              opts={{
                calmMode: true,
                audience: 'demo',
                includeReasoning: true,
                includeTalkTrack: true
              }}
            />
            {/* Capture as Golden */}
            {lastArtifactId && (
              <CaptureAsGoldenButton
                artifactId={lastArtifactId}
                defaultLabel={selectedPreset ? `UAV: ${selectedPreset.title}` : 'UAV Kernel Run'}
                runSuite={false}
              />
            )}
          </UiCard>

          {/* LLM Helper Panel */}
          {result.run && (() => {
            const model = buildFromKernelRun({
              ...result.run,
              createdAtIso: result.run.createdAtIso ?? new Date().toISOString(),
              inputHash: result.run.inputHash ?? ""
            } as any, {
              calmMode: true,
              audience: 'demo',
              includeReasoning: true
            });
            const payload = buildExplainablePayload(model);
            return (
              <LLMHelperPanel
                kind="kernelRun"
                payload={payload}
                title="AI Helper"
              />
            );
          })()}
        </>
      )}

      {/* Advanced Drawer */}
      <UiCard>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            padding: spacing.md,
            fontSize: textSizes.body,
            backgroundColor: 'transparent',
            border: '1px solid #ccc',
            borderRadius: 4,
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left'
          }}
        >
          {showAdvanced ? '▼' : '▶'} Advanced
        </button>

        {showAdvanced && (
          <div style={{ marginTop: spacing.md }}>
            <div style={{ marginBottom: spacing.md }}>
              <label style={{ display: 'block', marginBottom: spacing.sm, fontSize: textSizes.body }}>
                Learner ID
              </label>
              <input
                type="text"
                value={learnerId}
                onChange={(e) => setLearnerId(e.target.value)}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  fontSize: textSizes.body,
                  border: '1px solid #ccc',
                  borderRadius: 4
                }}
                placeholder="demo-uav"
              />
            </div>

            <div style={{ marginBottom: spacing.md }}>
              <label style={{ display: 'block', marginBottom: spacing.sm, fontSize: textSizes.body }}>
                Session ID (optional)
              </label>
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  fontSize: textSizes.body,
                  border: '1px solid #ccc',
                  borderRadius: 4
                }}
                placeholder="uav-demo-{timestamp}"
              />
            </div>

            <div style={{ marginBottom: spacing.md }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <input
                  type="checkbox"
                  checked={persist}
                  onChange={(e) => setPersist(e.target.checked)}
                />
                <span style={{ fontSize: textSizes.body }}>Persist to store</span>
              </label>
            </div>

            <div style={{ marginBottom: spacing.md }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <input
                  type="checkbox"
                  checked={attachToBoard}
                  onChange={(e) => setAttachToBoard(e.target.checked)}
                />
                <span style={{ fontSize: textSizes.body }}>Attach to Board</span>
              </label>
            </div>

            <div style={{ marginBottom: spacing.md }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <input
                  type="checkbox"
                  checked={includeAdapterDiagnostics}
                  onChange={(e) => setIncludeAdapterDiagnostics(e.target.checked)}
                />
                <span style={{ fontSize: textSizes.body }}>Include Adapter Diagnostics</span>
              </label>
            </div>
          </div>
        )}
      </UiCard>

      {/* Adapter Diagnostics */}
      {result?.adapterDiagnostics && (
        <UiCard style={{ marginBottom: spacing.lg }}>
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            style={{
              width: '100%',
              padding: spacing.md,
              fontSize: textSizes.body,
              backgroundColor: '#f5f5f5',
              border: '1px solid #ccc',
              borderRadius: 4,
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            Adapter Diagnostics ({result.adapterDiagnostics.issues.length} issues, {result.adapterDiagnostics.uncertaintyFlags.length} uncertainty flags)
            {showDiagnostics ? ' ▼' : ' ▶'}
          </button>
          {showDiagnostics && (
            <div style={{ marginTop: spacing.md }}>
              {result.adapterDiagnostics.confidenceHint && (
                <p style={{ fontSize: textSizes.body, marginBottom: spacing.sm }}>
                  <strong>Confidence Hint:</strong> {result.adapterDiagnostics.confidenceHint}
                </p>
              )}
              {result.adapterDiagnostics.issues.length > 0 && (
                <div style={{ marginBottom: spacing.md }}>
                  <h4 style={{ fontSize: textSizes.body, fontWeight: 'bold', margin: '0 0 ' + spacing.xs + ' 0' }}>
                    Issues ({result.adapterDiagnostics.issues.length})
                  </h4>
                  {result.adapterDiagnostics.issues.slice(0, 10).map((issue, idx) => (
                    <p key={idx} style={{ fontSize: textSizes.small, margin: spacing.xs + ' 0', paddingLeft: spacing.sm }}>
                      <span style={{ 
                        color: issue.severity === 'critical' ? '#d32f2f' : 
                               issue.severity === 'warn' ? '#ff9800' : '#2196f3'
                      }}>
                        [{issue.severity}]
                      </span> {issue.signalKey}: {issue.message}
                    </p>
                  ))}
                </div>
              )}
              {result.adapterDiagnostics.uncertaintyFlags.length > 0 && (
                <div>
                  <h4 style={{ fontSize: textSizes.body, fontWeight: 'bold', margin: '0 0 ' + spacing.xs + ' 0' }}>
                    Uncertainty Flags ({result.adapterDiagnostics.uncertaintyFlags.length})
                  </h4>
                  {result.adapterDiagnostics.uncertaintyFlags.slice(0, 10).map((flag, idx) => (
                    <p key={idx} style={{ fontSize: textSizes.small, margin: spacing.xs + ' 0', paddingLeft: spacing.sm }}>
                      <span style={{ 
                        color: flag.level === 'high' ? '#d32f2f' : 
                               flag.level === 'medium' ? '#ff9800' : '#4caf50'
                      }}>
                        [{flag.level}]
                      </span> {flag.signalKey}: {flag.reason}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </UiCard>
      )}
    </div>
  );
}

