/**
 * Kernel Studio Page
 * 
 * UI for pasting specs, compiling, running, and exporting.
 * ND-first: spec input collapsed by default.
 * 
 * Version: 1.0.0
 */

'use client';

import React, { useState, useEffect } from 'react';
import { SPACING, TEXT_SIZES } from '../ui/uiTokens';
import { UiCard } from '@/app/ui';
import ExplainablePanel from '../surfaces/explainable/ExplainablePanel';
import { KernelRunContract } from 'spine/contracts/KernelContracts';
import { KernelRunRecord } from 'spine/kernels/surfaces/learning/KernelSurfaceTypes';
import { draftSpec } from './copilotClient';
import type { OmegaMode } from '@/spine/llm/modes/OmegaModes';
import { OmegaModeSelect } from '@/app/components/omega/OmegaModeSelect';
import { OmegaMetaBadge } from '@/app/components/omega/OmegaMetaBadge';
import type { OmegaMeta } from '@/spine/llm/modes/OmegaMeta';

const spacing = SPACING.standard;
const textSizes = TEXT_SIZES.standard;

interface LibraryEntry {
  id: string;
  title: string;
  description: string;
  spec: any;
  defaultInput?: Record<string, unknown>;
}

export default function KernelStudioPage() {
  const [specText, setSpecText] = useState('');
  const [showSpecInput, setShowSpecInput] = useState(false);
  const [compiledId, setCompiledId] = useState<string | null>(null);
  const [validation, setValidation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<KernelRunContract | null>(null);
  const [runRecord, setRunRecord] = useState<KernelRunRecord | null>(null);
  const [inputSignals, setInputSignals] = useState<Record<string, unknown>>({});
  const [exportedArtifactId, setExportedArtifactId] = useState<string | null>(null);
  const [libraryEntries, setLibraryEntries] = useState<LibraryEntry[]>([]);
  const [selectedLibraryId, setSelectedLibraryId] = useState<string>('');
  const [libraryLoading, setLibraryLoading] = useState(false);
  
  // Copilot state
  const [copilotText, setCopilotText] = useState('');
  const [copilotStatus, setCopilotStatus] = useState<'idle' | 'disabled' | 'drafting' | 'ready' | 'error'>('idle');
  const [draftSpecObj, setDraftSpecObj] = useState<any>(null);
  const [draftSpecJson, setDraftSpecJson] = useState<string>('');
  const [draftValidation, setDraftValidation] = useState<any>(null);
  const [copilotError, setCopilotError] = useState<string | null>(null);
  const [omegaMode, setOmegaMode] = useState<OmegaMode | "">("");
  const [draftOmegaMeta, setDraftOmegaMeta] = useState<OmegaMeta | undefined>(undefined);

  // Helper: Pretty JSON formatter
  const prettyJson = (obj: any): string => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return '';
    }
  };

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

  // Initialize copilot status
  useEffect(() => {
    setCopilotStatus('idle');
  }, []);

  // Load library entries on mount
  useEffect(() => {
    async function loadLibrary() {
      try {
        const response = await fetch('/api/specs/library');
        if (response.ok) {
          const data = await response.json();
          setLibraryEntries(data.entries || []);
        }
      } catch (err) {
        // Library loading is optional, don't show error
      }
    }
    loadLibrary();
  }, []);

  // Handle copilot draft
  const handleDraftSpec = async () => {
    if (!copilotText.trim()) {
      setCopilotError('Text is required');
      return;
    }

    // Bound text to 20k chars
    let textToSend = copilotText;
    let truncated = false;
    if (textToSend.length > 20000) {
      textToSend = textToSend.substring(0, 20000);
      truncated = true;
    }

    setCopilotStatus('drafting');
    setCopilotError(null);
    setDraftSpecObj(null);
    setDraftSpecJson('');
    setDraftValidation(null);

    try {
      const result = await draftSpec(textToSend, omegaMode || undefined);

      if (!result.ok) {
        if (result.error === 'LLM_DISABLED') {
          setCopilotStatus('disabled');
          setCopilotError(null);
        } else {
          setCopilotStatus('error');
          setCopilotError(result.error || 'Failed to draft spec');
        }
        return;
      }

      if (result.specDraft) {
        setDraftSpecObj(result.specDraft);
        setDraftSpecJson(prettyJson(result.specDraft));
        setDraftValidation(result.validation || null);
        setDraftOmegaMeta(result.omegaMeta);
        setCopilotStatus('ready');
        if (truncated) {
          setCopilotError('Input text was truncated to 20,000 characters');
        }
      } else {
        setCopilotStatus('error');
        setCopilotError('No spec draft returned');
        setDraftOmegaMeta(undefined);
      }
    } catch (err: any) {
      setCopilotStatus('error');
      setCopilotError(err.message || 'Failed to draft spec');
    }
  };

  // Handle load draft into editor
  const handleLoadDraft = () => {
    if (!draftSpecJson) return;

    setSpecText(draftSpecJson);
    setShowSpecInput(true);

    // Set default input if present in draft
    if (draftSpecObj?.defaultInput) {
      setInputSignals(draftSpecObj.defaultInput);
    }

    // Auto-compile if draft is valid
    if (draftValidation?.ok && draftSpecObj) {
      handleCompileWithSpec(draftSpecObj);
    }
  };

  const handleLoadFromLibrary = async () => {
    if (!selectedLibraryId) {
      setError('Please select a library entry');
      return;
    }

    setLibraryLoading(true);
    setError(null);
    setSuccess(null);
    setCompiledId(null);
    setValidation(null);
    setRunResult(null);
    setRunRecord(null);

    try {
      const entry = libraryEntries.find(e => e.id === selectedLibraryId);
      if (!entry) {
        throw new Error('Library entry not found');
      }

      // Load spec into editor
      setSpecText(JSON.stringify(entry.spec, null, 2));
      setShowSpecInput(true);

      // Set default input if available
      if (entry.defaultInput) {
        setInputSignals(entry.defaultInput);
      }

      // Auto-compile
      await handleCompileWithSpec(entry.spec);
    } catch (err: any) {
      setError(err.message || 'Failed to load from library');
    } finally {
      setLibraryLoading(false);
    }
  };

  const handleCompileWithSpec = async (spec: any) => {
    setLoading(true);
    setError(null);
    setValidation(null);
    setCompiledId(null);
    setRunResult(null);
    setRunRecord(null);

    try {
      const response = await fetch('/api/specs/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec })
      });

      const data = await response.json();

      if (!data.ok) {
        setValidation(data.validation);
        setError('Spec validation failed');
        return;
      }

      setCompiledId(data.compiledId);
      setValidation(data.validation);
    } catch (err: any) {
      setError(err.message || 'Failed to compile spec');
    } finally {
      setLoading(false);
    }
  };

  const handleCompile = async () => {
    if (!specText.trim()) {
      setError('Spec is required');
      return;
    }

    setLoading(true);
    setError(null);
    setValidation(null);
    setCompiledId(null);
    setRunResult(null);
    setRunRecord(null);

    try {
      let spec: any;
      try {
        spec = JSON.parse(specText);
      } catch (e) {
        throw new Error('Invalid JSON spec');
      }

      const response = await fetch('/api/specs/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec })
      });

      const data = await response.json();

      if (!data.ok) {
        setValidation(data.validation);
        setError('Spec validation failed');
        return;
      }

      setCompiledId(data.compiledId);
      setValidation(data.validation);
    } catch (err: any) {
      setError(err.message || 'Failed to compile spec');
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    if (!compiledId) {
      setError('Spec must be compiled first');
      return;
    }

    setLoading(true);
    setError(null);
    setRunResult(null);
    setRunRecord(null);

    try {
      const response = await fetch('/api/specs/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compiledId,
          input: inputSignals,
          persist: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run kernel');
      }

      const data = await response.json();
      setRunResult(data.run);

      // Convert to KernelRunRecord for ExplainablePanel
      const record: KernelRunRecord = {
        runId: data.run.runId,
        kernelId: data.run.kernelId,
        adapterId: data.run.adapterId,
        sessionId: data.run.input.sessionId,
        learnerId: data.run.input.learnerId,
        createdAtIso: data.run.createdAtIso,
        inputHash: data.run.inputHash,
        decision: {
          outcomeId: data.run.decision.outcome,
          label: data.run.decision.outcome,
          confidence: data.run.decision.confidence,
          rationale: data.run.decision.rationale
        },
        claims: data.run.trace.claims.map((claim: any) => ({
          id: claim.claimId,
          type: claim.type,
          text: claim.statement
        })),
        trace: data.run.trace.nodes.map((node: any) => ({
          id: node.id,
          type: node.type,
          label: node.label,
          description: node.description || '',
          timestamp: node.timestamp
        }))
      };
      setRunRecord(record);
    } catch (err: any) {
      setError(err.message || 'Failed to run kernel');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!runResult) {
      setError('No run result to export');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Export as artifact using putArtifact API
      const response = await fetch('/api/artifacts/put', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'KERNEL_RUN',
          payloads: {
            run: runResult
          },
          meta: {
            artifactId: runResult.runId,
            notes: 'Exported from Kernel Studio'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to export artifact');
      }

      const data = await response.json();
      setExportedArtifactId(data.artifactId);
      setSuccess(`Artifact exported: ${data.artifactId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to export artifact');
    } finally {
      setLoading(false);
    }
  };

  const handleCaptureAsGolden = async () => {
    if (!exportedArtifactId) {
      setError('No artifact to capture. Export first.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Generate label from compiledId or spec
      const label = compiledId 
        ? `Spec: ${compiledId.substring(0, 20)}`
        : `Kernel Studio ${exportedArtifactId.substring(0, 8)}`;

      const response = await fetch('/api/regression/golden/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifactId: exportedArtifactId,
          label: label.length > 60 ? label.substring(0, 57) + '...' : label,
          runSuite: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to capture artifact');
      }

      const data = await response.json();
      if (data.added) {
        setSuccess(`Added ✓ (${data.goldenSuiteCount} total cases)`);
      } else {
        setSuccess('Already in suite');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to capture artifact');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: spacing.md, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: textSizes.h1, marginBottom: spacing.md }}>
        Kernel Studio
      </h1>

      {/* Copilot Panel */}
      <UiCard style={{ marginBottom: spacing.lg }}>
        <h2 style={{ fontSize: textSizes.h2, marginBottom: spacing.sm }}>
          Copilot
        </h2>
        
        {copilotStatus === 'disabled' && (
          <div style={{ 
            padding: spacing.sm, 
            backgroundColor: '#f5f5f5', 
            borderRadius: 4, 
            marginBottom: spacing.sm,
            fontSize: textSizes.small,
            color: '#6a6a6a'
          }}>
            LLM assist is disabled on this build.
          </div>
        )}

        <div style={{ marginBottom: spacing.sm }}>
          <textarea
            value={copilotText}
            onChange={(e) => {
              const text = e.target.value;
              setCopilotText(text);
              if (text.length > 20000) {
                setCopilotError('Text will be truncated to 20,000 characters');
              } else {
                setCopilotError(null);
              }
            }}
            placeholder="Paste a reference architecture, decision table, rules, or bullet spec…"
            style={{
              width: '100%',
              minHeight: 120,
              padding: spacing.sm,
              fontSize: textSizes.small,
              fontFamily: 'monospace',
              border: '1px solid #ccc',
              borderRadius: 4,
              resize: 'vertical'
            }}
          />
          {copilotText.length > 20000 && (
            <div style={{ fontSize: textSizes.small, color: '#f57c00', marginTop: spacing.xs }}>
              (truncated to 20,000 characters)
            </div>
          )}
        </div>

        <div style={{ marginBottom: spacing.sm }}>
          <OmegaModeSelect value={omegaMode} onChange={setOmegaMode} label="Omega mode (copilot)" />
        </div>

        <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.sm }}>
          <button
            onClick={handleDraftSpec}
            disabled={copilotStatus === 'disabled' || copilotStatus === 'drafting' || !copilotText.trim()}
            style={{
              padding: spacing.sm,
              fontSize: textSizes.body,
              backgroundColor: (copilotStatus === 'disabled' || copilotStatus === 'drafting' || !copilotText.trim()) 
                ? '#ccc' 
                : '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: (copilotStatus === 'disabled' || copilotStatus === 'drafting' || !copilotText.trim()) 
                ? 'not-allowed' 
                : 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {copilotStatus === 'drafting' ? 'Drafting…' : 'Draft KernelSpec'}
          </button>

          {copilotStatus === 'disabled' && (
            <span style={{ fontSize: textSizes.small, color: '#6a6a6a' }}>Disabled</span>
          )}
          {copilotStatus === 'drafting' && (
            <span style={{ fontSize: textSizes.small, color: '#1976d2' }}>Drafting…</span>
          )}
          {copilotStatus === 'ready' && (
            <span style={{ fontSize: textSizes.small, color: '#4caf50' }}>Ready</span>
          )}
          {copilotStatus === 'error' && (
            <span style={{ fontSize: textSizes.small, color: '#d32f2f' }}>Error</span>
          )}
        </div>

        {copilotError && copilotStatus !== 'disabled' && (
          <div style={{ 
            padding: spacing.sm, 
            backgroundColor: '#ffebee', 
            borderRadius: 4, 
            marginBottom: spacing.sm,
            fontSize: textSizes.small,
            color: '#d32f2f'
          }}>
            {copilotError}
          </div>
        )}

        {/* Draft Validation Preview */}
        {draftValidation && (
          <div style={{ 
            marginTop: spacing.sm, 
            padding: spacing.sm, 
            backgroundColor: '#f5f5f5', 
            borderRadius: 4 
          }}>
            <div style={{ fontSize: textSizes.small, fontWeight: 'bold', marginBottom: spacing.xs }}>
              Draft Validation:
            </div>
            {draftValidation.errors && draftValidation.errors.length > 0 && (
              <div style={{ marginBottom: spacing.xs }}>
                <strong style={{ color: '#d32f2f', fontSize: textSizes.small }}>
                  Errors ({draftValidation.errors.length}):
                </strong>
                {draftValidation.errors.slice(0, 3).map((err: string, idx: number) => (
                  <div key={idx} style={{ fontSize: textSizes.small, marginTop: 2, color: '#d32f2f' }}>
                    {err}
                  </div>
                ))}
              </div>
            )}
            {draftValidation.warnings && draftValidation.warnings.length > 0 && (
              <div style={{ marginBottom: spacing.xs }}>
                <strong style={{ color: '#f57c00', fontSize: textSizes.small }}>
                  Warnings ({draftValidation.warnings.length}):
                </strong>
                {draftValidation.warnings.slice(0, 3).map((warn: string, idx: number) => (
                  <div key={idx} style={{ fontSize: textSizes.small, marginTop: 2, color: '#f57c00' }}>
                    {warn}
                  </div>
                ))}
              </div>
            )}
            {draftValidation.ok && (
              <div style={{ color: '#4caf50', fontSize: textSizes.small, fontWeight: 'bold' }}>
                ✅ Draft is valid
              </div>
            )}
          </div>
        )}

        {/* Load Draft Button */}
        {draftSpecJson && (
          <div>
            <button
              onClick={handleLoadDraft}
              disabled={loading}
              style={{
                marginTop: spacing.sm,
                padding: spacing.sm,
                fontSize: textSizes.body,
                backgroundColor: loading ? '#ccc' : '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              Load draft into editor
            </button>
            <OmegaMetaBadge omega={draftOmegaMeta} />
          </div>
        )}
      </UiCard>

      {/* Load from Library */}
      {libraryEntries.length > 0 && (
        <UiCard style={{ marginBottom: spacing.lg }}>
          <h2 style={{ fontSize: textSizes.h2, marginBottom: spacing.sm }}>
            Load from Library
          </h2>
          <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: spacing.xs, fontSize: textSizes.small }}>
                Select Template:
              </label>
              <select
                value={selectedLibraryId}
                onChange={(e) => setSelectedLibraryId(e.target.value)}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  fontSize: textSizes.body,
                  border: '1px solid #ccc',
                  borderRadius: 4
                }}
              >
                <option value="">-- Select a template --</option>
                {libraryEntries.map(entry => (
                  <option key={entry.id} value={entry.id}>
                    {entry.title}
                  </option>
                ))}
              </select>
              {selectedLibraryId && (
                <p style={{ fontSize: textSizes.small, opacity: 0.7, marginTop: spacing.xs }}>
                  {libraryEntries.find(e => e.id === selectedLibraryId)?.description}
                </p>
              )}
            </div>
            <button
              onClick={handleLoadFromLibrary}
              disabled={!selectedLibraryId || libraryLoading || loading}
              style={{
                padding: spacing.sm,
                fontSize: textSizes.body,
                backgroundColor: (!selectedLibraryId || libraryLoading || loading) ? '#ccc' : '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: (!selectedLibraryId || libraryLoading || loading) ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {libraryLoading ? 'Loading...' : 'Load'}
            </button>
          </div>
        </UiCard>
      )}

      {/* Spec Input (collapsed by default) */}
      <UiCard style={{ marginBottom: spacing.lg }}>
        <div
          onClick={() => setShowSpecInput(!showSpecInput)}
          style={{
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: showSpecInput ? spacing.sm : 0
          }}
        >
          <h2 style={{ fontSize: textSizes.h2, margin: 0 }}>
            Kernel Spec {showSpecInput ? '▼' : '▶'}
          </h2>
        </div>

        {showSpecInput && (
          <div>
            <textarea
              value={specText}
              onChange={(e) => setSpecText(e.target.value)}
              placeholder='Paste KernelSpec JSON here...'
              style={{
                width: '100%',
                minHeight: 300,
                padding: spacing.sm,
                fontSize: textSizes.small,
                fontFamily: 'monospace',
                border: '1px solid #ccc',
                borderRadius: 4
              }}
            />
            <button
              onClick={handleCompile}
              disabled={loading || !specText.trim()}
              style={{
                marginTop: spacing.sm,
                padding: spacing.sm,
                fontSize: textSizes.body,
                backgroundColor: loading || !specText.trim() ? '#ccc' : '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: loading || !specText.trim() ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Compiling...' : 'Compile Spec'}
            </button>
          </div>
        )}
      </UiCard>

      {/* Validation Results */}
      {validation && (
        <UiCard style={{ marginBottom: spacing.lg }}>
          <h3 style={{ fontSize: textSizes.h3, marginBottom: spacing.sm }}>
            Validation
          </h3>
          {validation.errors && validation.errors.length > 0 && (
            <div style={{ marginBottom: spacing.sm }}>
              <strong style={{ color: '#d32f2f' }}>Errors ({validation.errors.length}):</strong>
              {validation.errors.slice(0, 5).map((err: any, idx: number) => (
                <div key={idx} style={{ fontSize: textSizes.small, marginTop: spacing.xs }}>
                  {err.path}: {err.message}
                </div>
              ))}
            </div>
          )}
          {validation.warnings && validation.warnings.length > 0 && (
            <div>
              <strong style={{ color: '#f57c00' }}>Warnings ({validation.warnings.length}):</strong>
              {validation.warnings.slice(0, 5).map((warn: any, idx: number) => (
                <div key={idx} style={{ fontSize: textSizes.small, marginTop: spacing.xs }}>
                  {warn.path}: {warn.message}
                </div>
              ))}
            </div>
          )}
          {validation.ok && (
            <div style={{ color: '#4caf50', fontWeight: 'bold' }}>
              ✅ Spec is valid
            </div>
          )}
        </UiCard>
      )}

      {/* Compiled Info */}
      {compiledId && (
        <UiCard style={{ marginBottom: spacing.lg }}>
          <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.sm }}>
            <span style={{ color: '#4caf50', fontWeight: 'bold' }}>✅ Compiled</span>
            <span style={{ fontSize: textSizes.small, opacity: 0.7 }}>
              ID: {compiledId}
            </span>
          </div>

          {/* Input Signals */}
          <div style={{ marginBottom: spacing.sm }}>
            <label style={{ display: 'block', marginBottom: spacing.xs, fontSize: textSizes.small }}>
              Input Signals (JSON):
            </label>
            <textarea
              value={JSON.stringify(inputSignals, null, 2)}
              onChange={(e) => {
                try {
                  setInputSignals(JSON.parse(e.target.value));
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              placeholder='{"signal1": value1, "signal2": value2}'
              style={{
                width: '100%',
                minHeight: 100,
                padding: spacing.sm,
                fontSize: textSizes.small,
                fontFamily: 'monospace',
                border: '1px solid #ccc',
                borderRadius: 4
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: spacing.sm }}>
            <button
              onClick={handleRun}
              disabled={loading}
              style={{
                padding: spacing.sm,
                fontSize: textSizes.body,
                backgroundColor: loading ? '#ccc' : '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Running...' : 'Run'}
            </button>
            {runResult && (
              <>
                <button
                  onClick={handleExport}
                  disabled={loading}
                  style={{
                    padding: spacing.sm,
                    fontSize: textSizes.body,
                    backgroundColor: loading ? '#ccc' : '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  Export Artifact
                </button>
                {exportedArtifactId && (
                  <button
                    onClick={handleCaptureAsGolden}
                    disabled={loading}
                    style={{
                      padding: spacing.sm,
                      fontSize: textSizes.body,
                      backgroundColor: loading ? '#ccc' : '#f57c00',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Capture as Golden
                  </button>
                )}
              </>
            )}
          </div>
        </UiCard>
      )}

      {/* Error */}
      {error && (
        <UiCard style={{ marginBottom: spacing.lg, backgroundColor: '#ffebee' }}>
          <p style={{ color: '#d32f2f', fontSize: textSizes.body }}>{error}</p>
        </UiCard>
      )}

      {/* Success */}
      {success && (
        <UiCard style={{ marginBottom: spacing.lg, backgroundColor: '#e8f5e9' }}>
          <p style={{ color: '#4caf50', fontSize: textSizes.body }}>{success}</p>
        </UiCard>
      )}

      {/* Run Result */}
      {runRecord && (
        <UiCard>
          <h3 style={{ fontSize: textSizes.h3, marginBottom: spacing.sm }}>
            Result
          </h3>
          <ExplainablePanel
            mode="kernel"
            run={runRecord}
            opts={{
              calmMode: true,
              audience: 'demo',
              includeReasoning: true
            }}
          />
        </UiCard>
      )}
    </div>
  );
}

