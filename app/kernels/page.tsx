'use client';

import React, { useState } from 'react';
import { SPACING, MAX_LINE_WIDTH, TEXT_SIZES, TAP_MIN_PX } from '../learning/ui/uiTokens';
import UiCard from '../learning/ui/UiCard';

interface KernelRunResult {
  ok: boolean;
  run: {
    runId: string;
    kernelId: string;
    adapterId: string;
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
    }>;
  };
  thoughtObjects?: Array<{
    id: string;
    type: string;
    content: string | { title: string; body: string };
  }>;
}

const PRESET_INPUTS = [
  {
    label: 'Nominal Flight',
    input: {
      altitude: 75,
      healthStatus: 'H1',
      environment: 'E1',
      timeToContact: 25
    }
  },
  {
    label: 'Degraded Health',
    input: {
      altitude: 30,
      healthStatus: 'H2',
      environment: 'E1',
      timeToContact: 20
    }
  },
  {
    label: 'Emergency Landing',
    input: {
      altitude: 15,
      healthStatus: 'H3',
      environment: 'E3',
      timeToContact: 3
    }
  }
];

export default function KernelsPage() {
  const [adapterId, setAdapterId] = useState('uav_safe_landing');
  const [kernelId, setKernelId] = useState('safe_landing_decision_square_v2_3');
  const [learnerId, setLearnerId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [input, setInput] = useState(PRESET_INPUTS[0].input);
  const [persist, setPersist] = useState(true);
  const [attachToBoard, setAttachToBoard] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<KernelRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/kernels/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learnerId: learnerId || undefined,
          sessionId: sessionId || undefined,
          adapterId,
          kernelId,
          input,
          persist: persist && !!learnerId,
          attachToBoard: attachToBoard && !!learnerId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run kernel');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to run kernel');
    } finally {
      setLoading(false);
    }
  };

  const handlePreset = (preset: typeof PRESET_INPUTS[0]) => {
    setInput(preset.input);
  };

  return (
    <div style={{ padding: SPACING.standard.md, maxWidth: MAX_LINE_WIDTH, margin: '0 auto' }}>
      <h1 style={{ fontSize: TEXT_SIZES.heading, marginBottom: SPACING.large }}>
        Kernel Runner
      </h1>

      <p style={{ fontSize: TEXT_SIZES.body, marginBottom: SPACING.large, opacity: 0.7 }}>
        Run kernel decisions deterministically. Results can be persisted and attached to the Learning Board.
      </p>

      {/* Adapter Selection */}
      <UiCard style={{ marginBottom: SPACING.large }}>
        <label style={{ display: 'block', marginBottom: SPACING.small, fontSize: TEXT_SIZES.body }}>
          Adapter
        </label>
        <select
          value={adapterId}
          onChange={(e) => setAdapterId(e.target.value)}
          style={{
            width: '100%',
            padding: SPACING.small,
            fontSize: TEXT_SIZES.body,
            border: '1px solid #ccc',
            borderRadius: 4
          }}
        >
          <option value="uav_safe_landing">UAV Safe Landing</option>
        </select>
      </UiCard>

      {/* Input Presets */}
      <UiCard style={{ marginBottom: SPACING.large }}>
        <h2 style={{ fontSize: TEXT_SIZES.subheading, marginBottom: SPACING.standard.md }}>
          Example Inputs
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING.small }}>
          {PRESET_INPUTS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handlePreset(preset)}
              style={{
                padding: SPACING.standard.md,
                fontSize: TEXT_SIZES.body,
                backgroundColor: '#f5f5f5',
                border: '1px solid #ccc',
                borderRadius: 4,
                cursor: 'pointer',
                minHeight: TAP_MIN_PX
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </UiCard>

      {/* Run Button */}
      <UiCard style={{ marginBottom: SPACING.large }}>
        <button
          onClick={handleRun}
          disabled={loading}
          style={{
            width: '100%',
            padding: SPACING.standard.md,
            fontSize: TEXT_SIZES.body,
            backgroundColor: loading ? '#ccc' : '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer',
            minHeight: TAP_MIN_PX
          }}
        >
          {loading ? 'Running...' : 'Run Kernel'}
        </button>
      </UiCard>

      {/* Advanced Options */}
      <UiCard style={{ marginBottom: SPACING.large }}>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            padding: SPACING.standard.md,
            fontSize: TEXT_SIZES.body,
            backgroundColor: 'transparent',
            border: '1px solid #ccc',
            borderRadius: 4,
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left'
          }}
        >
          {showAdvanced ? '▼' : '▶'} Advanced Options
        </button>

        {showAdvanced && (
          <div style={{ marginTop: SPACING.standard.md }}>
            <div style={{ marginBottom: SPACING.standard.md }}>
              <label style={{ display: 'block', marginBottom: SPACING.small, fontSize: TEXT_SIZES.body }}>
                Learner ID (optional)
              </label>
              <input
                type="text"
                value={learnerId}
                onChange={(e) => setLearnerId(e.target.value)}
                style={{
                  width: '100%',
                  padding: SPACING.small,
                  fontSize: TEXT_SIZES.body,
                  border: '1px solid #ccc',
                  borderRadius: 4
                }}
                placeholder="e.g., learner_123"
              />
            </div>

            <div style={{ marginBottom: SPACING.standard.md }}>
              <label style={{ display: 'block', marginBottom: SPACING.small, fontSize: TEXT_SIZES.body }}>
                Session ID (optional)
              </label>
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                style={{
                  width: '100%',
                  padding: SPACING.small,
                  fontSize: TEXT_SIZES.body,
                  border: '1px solid #ccc',
                  borderRadius: 4
                }}
                placeholder="e.g., session_123"
              />
            </div>

            <div style={{ marginBottom: SPACING.standard.md }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: SPACING.small }}>
                <input
                  type="checkbox"
                  checked={persist}
                  onChange={(e) => setPersist(e.target.checked)}
                />
                <span style={{ fontSize: TEXT_SIZES.body }}>Persist to store</span>
              </label>
            </div>

            <div style={{ marginBottom: SPACING.standard.md }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: SPACING.small }}>
                <input
                  type="checkbox"
                  checked={attachToBoard}
                  onChange={(e) => setAttachToBoard(e.target.checked)}
                />
                <span style={{ fontSize: TEXT_SIZES.body }}>Attach to Learning Board</span>
              </label>
            </div>
          </div>
        )}
      </UiCard>

      {/* Error */}
      {error && (
        <UiCard style={{ marginBottom: SPACING.large, backgroundColor: '#ffebee' }}>
          <p style={{ color: '#d32f2f', fontSize: TEXT_SIZES.body }}>{error}</p>
        </UiCard>
      )}

      {/* Result */}
      {result && (
        <UiCard style={{ marginBottom: SPACING.large }}>
          <h2 style={{ fontSize: TEXT_SIZES.subheading, marginBottom: SPACING.standard.md }}>
            Outcome
          </h2>
          <div style={{ 
            padding: SPACING.standard.md, 
            backgroundColor: '#e3f2fd', 
            borderRadius: 4,
            marginBottom: SPACING.standard.md
          }}>
            <p style={{ fontSize: TEXT_SIZES.heading, margin: 0, fontWeight: 'bold' }}>
              {result.run.decision.label}
            </p>
            <p style={{ fontSize: TEXT_SIZES.body, margin: SPACING.small + ' 0 0 0', opacity: 0.7 }}>
              {result.run.decision.rationale}
            </p>
            <p style={{ fontSize: TEXT_SIZES.small, margin: SPACING.small + ' 0 0 0', opacity: 0.6 }}>
              Confidence: {result.run.decision.confidence}
            </p>
          </div>

          {/* Claims */}
          {result.run.claims.length > 0 && (
            <div style={{ marginBottom: SPACING.standard.md }}>
              <h3 style={{ fontSize: TEXT_SIZES.body, marginBottom: SPACING.small }}>
                Claims
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING.small }}>
                {result.run.claims.map((claim) => (
                  <span
                    key={claim.id}
                    style={{
                      padding: SPACING.small,
                      fontSize: TEXT_SIZES.small,
                      backgroundColor: '#f5f5f5',
                      border: '1px solid #ccc',
                      borderRadius: 4
                    }}
                  >
                    {claim.text}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reasoning Accordion */}
          <div style={{ marginTop: SPACING.standard.md }}>
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              style={{
                padding: SPACING.small,
                fontSize: TEXT_SIZES.body,
                backgroundColor: 'transparent',
                border: '1px solid #ccc',
                borderRadius: 4,
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left'
              }}
            >
              {showReasoning ? '▼' : '▶'} Show Reasoning
            </button>

            {showReasoning && result.run.trace.length > 0 && (
              <div style={{ marginTop: SPACING.standard.md, padding: SPACING.standard.md, backgroundColor: '#f9f9f9', borderRadius: 4 }}>
                {result.run.trace.slice(0, 5).map((node) => (
                  <div key={node.id} style={{ marginBottom: SPACING.small }}>
                    <p style={{ fontSize: TEXT_SIZES.small, fontWeight: 'bold', margin: 0 }}>
                      {node.label}
                    </p>
                    <p style={{ fontSize: TEXT_SIZES.small, margin: SPACING.small + ' 0 0 0', opacity: 0.7 }}>
                      {node.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Thought Objects */}
          {result.thoughtObjects && result.thoughtObjects.length > 0 && (
            <div style={{ marginTop: SPACING.standard.md, padding: SPACING.standard.md, backgroundColor: '#e8f5e9', borderRadius: 4 }}>
              <p style={{ fontSize: TEXT_SIZES.body, fontWeight: 'bold', margin: '0 0 ' + SPACING.small + ' 0' }}>
                Added to Learning Board ({result.thoughtObjects.length} objects)
              </p>
            </div>
          )}
        </UiCard>
      )}
    </div>
  );
}








































