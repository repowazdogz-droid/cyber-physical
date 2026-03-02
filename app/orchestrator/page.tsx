'use client';

import React, { useState } from 'react';
import { SPACING, MAX_LINE_WIDTH, TEXT_SIZES, TAP_MIN_PX } from '../learning/ui/uiTokens';
import UiCard from '../learning/ui/UiCard';
import { appendThoughtObjectsToBoard } from '../learning/persist/LearningPersist';
import ExplainablePanel from '../surfaces/explainable/ExplainablePanel';
import { OrchestratorRun } from '@spine/orchestrator/OrchestratorTypes';

function toOrchestratorRun(x: any): OrchestratorRun {
  return {
    ...x,
    contractVersion: x.contractVersion ?? "1.0.0",
    createdAtIso: x.createdAtIso ?? new Date().toISOString(),
    nodes: x.nodes ?? [],
    edges: x.edges ?? [],
    trace: x.trace ?? { nodes: [], claims: [] }
  } as OrchestratorRun;
}
import CaptureAsGoldenButton from '../surfaces/explainable/components/CaptureAsGoldenButton';
import LLMHelperPanel from '../surfaces/explainable/components/LLMHelperPanel';
import { buildFromOrchestratorRun } from '../surfaces/explainable/ExplainableModelBuilder';
import { buildExplainablePayload } from '../surfaces/explainable/llmPayloadBuilder';

const spacing = SPACING.standard;
const textSizes = TEXT_SIZES.standard;

interface OrchestratorRunResult {
  ok: boolean;
  orchestratorRun: {
    graphId: string;
    terminalOutcome: string;
    terminalNodeId: string;
    summaryClaims: Array<{
      claimId: string;
      title: string;
      severity: "info" | "warn" | "critical";
      count: number;
    }>;
    policyNotes: string[];
    boundedTraceHighlights: Array<{
      nodeId: string;
      label: string;
      description: string;
      type: "override" | "disallow" | "decision" | "claim";
    }>;
    nodeCount: number;
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
}

// UAV Presets
const UAV_PRESETS = {
  safe_landing: {
    name: 'Safe Landing Decision',
    graphSpec: {
      graphId: 'uav_safe_landing_single',
      nodes: [
        {
          nodeId: 'landing_decision',
          adapterId: 'uav_safe_landing',
          kernelId: 'safe_landing_decision_square_v2_3',
          inputRef: 'uav_input',
          dependsOn: [],
          isTerminal: true
        }
      ],
      maxSteps: 25
    },
    inputBag: {
      uav_input: {
        altitudeMeters: 150,
        healthPercentage: 85,
        environmentHazardLevel: 2,
        timeToContactSeconds: 45
      }
    }
  },
  composite_ambiguity: {
    name: 'Composite Ambiguity',
    graphSpec: {
      graphId: 'uav_composite_ambiguity',
      nodes: [
        {
          nodeId: 'primary_decision',
          adapterId: 'uav_safe_landing',
          kernelId: 'safe_landing_decision_square_v2_3',
          inputRef: 'uav_input_1',
          dependsOn: [],
          isTerminal: false
        },
        {
          nodeId: 'secondary_decision',
          adapterId: 'uav_safe_landing',
          kernelId: 'safe_landing_decision_square_v2_3',
          inputRef: 'uav_input_2',
          dependsOn: ['primary_decision'],
          isTerminal: true
        }
      ],
      maxSteps: 25
    },
    inputBag: {
      uav_input_1: {
        altitudeMeters: 200,
        healthPercentage: 70,
        environmentHazardLevel: 3,
        timeToContactSeconds: 30
      },
      uav_input_2: {
        altitudeMeters: 100,
        healthPercentage: 60,
        environmentHazardLevel: 4,
        timeToContactSeconds: 15
      }
    }
  }
};

export default function OrchestratorPage() {
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof UAV_PRESETS | null>(null);
  const [learnerId, setLearnerId] = useState('demo-orchestrator');
  const [sessionId, setSessionId] = useState('');
  const [globalPolicyPackId, setGlobalPolicyPackId] = useState('uav_safety_conservative');
  const [persist, setPersist] = useState(true);
  const [attachToBoard, setAttachToBoard] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrchestratorRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [boardSent, setBoardSent] = useState(false);
  const [lastArtifactId, setLastArtifactId] = useState<string | null>(null);

  const handleRun = async (presetKey: keyof typeof UAV_PRESETS) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setBoardSent(false);

    try {
      const preset = UAV_PRESETS[presetKey];
      const response = await fetch('/api/orchestrator/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graphSpec: preset.graphSpec,
          inputBag: preset.inputBag,
          globalPolicyPackId: globalPolicyPackId || undefined,
          learnerId: learnerId || undefined,
          sessionId: sessionId || undefined,
          persist: persist && !!learnerId,
          attachToBoard: attachToBoard && !!learnerId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to run orchestrator');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setResult(data);
      setSelectedPreset(presetKey);
      
      // Track artifactId if run was persisted
      if (data.orchestratorRun?.graphId && persist && learnerId) {
        setLastArtifactId(data.orchestratorRun.graphId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to run orchestrator');
    } finally {
      setLoading(false);
    }
  };

  const handleSendToBoard = async () => {
    if (!result?.thoughtObjects || !learnerId) return;

    try {
      await appendThoughtObjectsToBoard(result.thoughtObjects, learnerId);
      setBoardSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send to board');
    }
  };

  const handleExportArtifact = async () => {
    if (!result || !result.orchestratorRun) {
      setError('No orchestrator run to export');
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
          kind: 'ORCHESTRATOR_RUN',
          payloads: {
            orchestratorRun: result.orchestratorRun
          },
          meta: {
            artifactId: result.orchestratorRun.graphId,
            learnerId: learnerId || undefined,
            sessionId: sessionId || undefined,
            notes: 'Exported from Orchestrator page'
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
    <div style={{ maxWidth: MAX_LINE_WIDTH, margin: '0 auto', padding: spacing.lg }}>
      <h1 style={{ fontSize: textSizes.h1, marginBottom: spacing.lg }}>
        Kernel Orchestrator
      </h1>

      {/* Policy Pack Selector */}
      <UiCard style={{ marginBottom: spacing.lg }}>
        <label style={{ display: 'block', marginBottom: spacing.sm, fontSize: textSizes.body }}>
          Global Policy Pack
        </label>
        <select
          value={globalPolicyPackId}
          onChange={(e) => setGlobalPolicyPackId(e.target.value)}
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

      {/* Preset Buttons */}
      <UiCard style={{ marginBottom: spacing.lg }}>
        <h2 style={{ fontSize: textSizes.h2, marginBottom: spacing.md }}>
          Choose Scenario
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {Object.entries(UAV_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => handleRun(key as keyof typeof UAV_PRESETS)}
              disabled={loading}
              style={{
                padding: spacing.md,
                fontSize: textSizes.body,
                backgroundColor: selectedPreset === key ? '#4caf50' : '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: loading ? 'not-allowed' : 'pointer',
                minHeight: TAP_MIN_PX
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </UiCard>

      {/* Advanced Options */}
      <UiCard style={{ marginBottom: spacing.lg }}>
        <h3 style={{ fontSize: textSizes.h3, marginBottom: spacing.sm }}>
          Advanced Options
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          <label>
            <input
              type="checkbox"
              checked={persist}
              onChange={(e) => setPersist(e.target.checked)}
              style={{ marginRight: spacing.xs }}
            />
            Persist to store
          </label>
          <label>
            <input
              type="checkbox"
              checked={attachToBoard}
              onChange={(e) => setAttachToBoard(e.target.checked)}
              style={{ marginRight: spacing.xs }}
            />
            Attach to board
          </label>
          <input
            type="text"
            placeholder="Learner ID (optional)"
            value={learnerId}
            onChange={(e) => setLearnerId(e.target.value)}
            style={{
              padding: spacing.sm,
              fontSize: textSizes.body,
              border: '1px solid #ccc',
              borderRadius: 4
            }}
          />
          <input
            type="text"
            placeholder="Session ID (optional)"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            style={{
              padding: spacing.sm,
              fontSize: textSizes.body,
              border: '1px solid #ccc',
              borderRadius: 4
            }}
          />
        </div>
      </UiCard>

      {/* Loading */}
      {loading && (
        <UiCard style={{ marginBottom: spacing.lg }}>
          <p style={{ fontSize: textSizes.body }}>Running orchestrator...</p>
        </UiCard>
      )}

      {/* Error */}
      {error && (
        <UiCard style={{ marginBottom: spacing.lg, backgroundColor: '#ffebee' }}>
          <p style={{ color: '#d32f2f', fontSize: textSizes.body }}>Error: {error}</p>
        </UiCard>
      )}

      {/* Result */}
      {result && (
        <>
          {/* Explainable Panel */}
          <UiCard style={{ marginBottom: spacing.lg }}>
            <h2 style={{ fontSize: textSizes.h2, marginBottom: spacing.md }}>
              Outcome
            </h2>
            <ExplainablePanel
              mode="orchestrator"
              run={toOrchestratorRun(result.orchestratorRun)}
              opts={{
                calmMode: true,
                audience: 'demo',
                includeReasoning: true,
                includeTalkTrack: false
              }}
            />
            {/* Capture as Golden */}
            {lastArtifactId && (
              <CaptureAsGoldenButton
                artifactId={lastArtifactId}
                defaultLabel={selectedPreset ? `Orchestrator: ${UAV_PRESETS[selectedPreset].name}` : 'Orchestrator Run'}
                runSuite={false}
              />
            )}
          </UiCard>

          {/* LLM Helper Panel */}
          {result.orchestratorRun && (() => {
            const model = buildFromOrchestratorRun(toOrchestratorRun(result.orchestratorRun), {
              calmMode: true,
              audience: 'demo',
              includeReasoning: true
            });
            const payload = buildExplainablePayload(model);
            return (
              <LLMHelperPanel
                kind="orchestratorRun"
                payload={payload}
                title="AI Helper"
              />
            );
          })()}

          {/* Send to Board */}
          {result.thoughtObjects && learnerId && (
            <UiCard style={{ marginBottom: spacing.lg }}>
              <button
                onClick={handleSendToBoard}
                disabled={boardSent || loading}
                style={{
                  padding: spacing.md,
                  fontSize: textSizes.body,
                  backgroundColor: boardSent ? '#4caf50' : '#2196f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: boardSent ? 'default' : 'pointer',
                  minHeight: TAP_MIN_PX,
                  width: '100%'
                }}
              >
                {boardSent ? 'Sent to Board!' : 'Send to Board'}
              </button>
            </UiCard>
          )}

          {/* Export Artifact */}
          {result && (
            <UiCard style={{ marginBottom: spacing.lg }}>
              <button
                onClick={handleExportArtifact}
                disabled={loading}
                style={{
                  padding: spacing.md,
                  fontSize: textSizes.body,
                  backgroundColor: loading ? '#ccc' : '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  minHeight: TAP_MIN_PX,
                  width: '100%'
                }}
              >
                Export Artifact
              </button>
            </UiCard>
          )}
        </>
      )}
    </div>
  );
}

