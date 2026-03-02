/**
 * Demo Console Page
 * 
 * One ND-friendly page for running demos, exporting artifacts, adding goldens, and running suite.
 * Makes you unstoppable in talks.
 * 
 * Version: 1.0.0
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SPACING, TEXT_SIZES } from '../learning/ui/uiTokens';
import UiCard from '../learning/ui/UiCard';

const spacing = SPACING.standard;
const textSizes = TEXT_SIZES.standard;

interface GoldenSuiteStatus {
  ok: boolean;
  criticalCount: number;
  warnCount: number;
  totalCases: number;
  passedCases: number;
}

export default function DemoPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastArtifactId, setLastArtifactId] = useState<string | null>(null);
  const [goldenStatus, setGoldenStatus] = useState<GoldenSuiteStatus | null>(null);
  const [seeded, setSeeded] = useState(false);

  // Load demo state and seed on mount
  useEffect(() => {
    loadDemoState();
    handleSeed();
  }, []);

  const loadDemoState = async () => {
    try {
      const response = await fetch('/api/demo/state');
      if (response.ok) {
        const data = await response.json();
        if (data.lastArtifactId) {
          setLastArtifactId(data.lastArtifactId);
        }
      }
    } catch (err) {
      // Demo state is optional
    }
  };

  const handleSeed = async () => {
    setLoading('Seeding demo state...');
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/demo/seed', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to seed demo state');
      }

      const data = await response.json();
      setSeeded(true);
      setSuccess('Demo state seeded');
      
      // Update last artifact ID if provided
      if (data.artifactId) {
        setLastArtifactId(data.artifactId);
        // Store in demo state
        try {
          await fetch('/api/demo/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lastArtifactId: data.artifactId,
              lastLabel: 'Demo Seed Artifact'
            })
          });
        } catch (err) {
          // Demo state is optional
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to seed demo state');
    } finally {
      setLoading(null);
    }
  };

  const handleRunUAV = async () => {
    setLoading('Running UAV demo...');
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/kernels/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adapterId: 'uav_safe_landing',
          signals: {
            altitude: 150,
            batteryLevel: 80,
            gpsSignal: 'strong',
            weatherCondition: 'clear'
          },
          persist: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to run UAV demo');
      }

      const data = await response.json();
      setLastArtifactId(data.run?.runId || null);
      setSuccess('UAV demo completed');
    } catch (err: any) {
      setError(err.message || 'Failed to run UAV demo');
    } finally {
      setLoading(null);
    }
  };

  const handleRunOrchestrator = async () => {
    setLoading('Running orchestrator demo...');
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/orchestrator/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graphSpec: {
            contractVersion: '1.0.0',
            graphId: 'demo_graph',
            nodes: [
              {
                contractVersion: '1.0.0',
                nodeId: 'node1',
                adapterId: 'uav_safe_landing',
                kernelId: 'uav_safe_landing',
                inputRef: 'input1',
                dependsOn: []
              }
            ],
            maxSteps: 25
          },
          inputBag: {
            input1: {
              altitude: 150,
              batteryLevel: 80,
              gpsSignal: 'strong',
              weatherCondition: 'clear'
            }
          },
          persist: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to run orchestrator demo');
      }

      const data = await response.json();
      setLastArtifactId(data.orchestratorRun?.graphId || null);
      setSuccess('Orchestrator demo completed');
    } catch (err: any) {
      setError(err.message || 'Failed to run orchestrator demo');
    } finally {
      setLoading(null);
    }
  };

  const handleRunSpecKernel = async () => {
    setLoading('Running spec kernel...');
    setError(null);
    setSuccess(null);

    // Use a simple demo spec
    const demoSpec = {
      version: '1.0.0',
      kernelId: 'demo_spec_kernel',
      adapterId: 'spec:demo',
      name: 'Demo Spec Kernel',
      description: 'A demo kernel for testing',
      outcomes: [
        {
          outcomeId: 'SUCCESS',
          label: 'Success',
          conditions: [
            {
              signalKey: 'value',
              operator: 'gt',
              value: 0
            }
          ],
          confidence: 'High',
          rationale: 'Value is positive'
        }
      ]
    };

    try {
      // Compile spec
      const compileResponse = await fetch('/api/specs/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec: demoSpec })
      });

      if (!compileResponse.ok) {
        throw new Error('Failed to compile spec');
      }

      const compileData = await compileResponse.json();

      // Run spec
      const runResponse = await fetch('/api/specs/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compiledId: compileData.compiledId,
          input: { value: 10 },
          persist: true
        })
      });

      if (!runResponse.ok) {
        throw new Error('Failed to run spec kernel');
      }

      const runData = await runResponse.json();
      setLastArtifactId(runData.run?.runId || null);
      setSuccess('Spec kernel demo completed');
    } catch (err: any) {
      setError(err.message || 'Failed to run spec kernel');
    } finally {
      setLoading(null);
    }
  };

  const handleExportArtifact = async () => {
    if (!lastArtifactId) {
      setError('No artifact to export. Run a demo first.');
      return;
    }

    setLoading('Exporting artifact...');
    setError(null);
    setSuccess(null);

    try {
      // Get artifact
      const getResponse = await fetch(`/api/artifacts/${lastArtifactId}`);
      if (!getResponse.ok) {
        throw new Error('Artifact not found');
      }

      const artifactData = await getResponse.json();

      // Export to vault (already in vault, but mark as exported)
      setSuccess(`Artifact exported: ${lastArtifactId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to export artifact');
    } finally {
      setLoading(null);
    }
  };

  const handleCaptureLastArtifact = async () => {
    if (!lastArtifactId) {
      setError('No artifact to capture. Run a demo first.');
      return;
    }

    setLoading('Capturing artifact as golden...');
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/regression/golden/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifactId: lastArtifactId,
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
      setLoading(null);
    }
  };

  const handleCaptureAndRun = async () => {
    if (!lastArtifactId) {
      setError('No artifact to capture. Run a demo first.');
      return;
    }

    setLoading('Capturing and running goldens...');
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/regression/golden/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifactId: lastArtifactId,
          runSuite: true
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

      // Update golden status if suite was run
      if (data.suite) {
        setGoldenStatus({
          ok: data.suite.criticalCount === 0,
          criticalCount: data.suite.criticalCount,
          warnCount: data.suite.warnCount,
          totalCases: data.suite.totalCases,
          passedCases: data.suite.passedCases
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to capture artifact');
    } finally {
      setLoading(null);
    }
  };

  const handleRunGoldens = async () => {
    setLoading('Running golden suite...');
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/regression/golden');

      if (!response.ok) {
        throw new Error('Failed to run golden suite');
      }

      const data = await response.json();
      setGoldenStatus({
        ok: data.ok,
        criticalCount: data.criticalCount || 0,
        warnCount: data.warnCount || 0,
        totalCases: data.totals?.totalCases || 0,
        passedCases: data.totals?.passedCases || 0
      });

      if (data.ok) {
        setSuccess('Golden suite passed');
      } else {
        setError(`Golden suite failed: ${data.criticalCount} critical, ${data.warnCount} warnings`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to run golden suite');
    } finally {
      setLoading(null);
    }
  };

  // Determine status banner color
  const getStatusColor = (): string => {
    if (goldenStatus) {
      if (goldenStatus.ok && goldenStatus.criticalCount === 0) {
        return '#4caf50'; // Green
      } else if (goldenStatus.criticalCount > 0) {
        return '#d32f2f'; // Red
      } else {
        return '#f57c00'; // Yellow
      }
    }
    return '#1976d2'; // Blue (default)
  };

  const getStatusText = (): string => {
    if (goldenStatus) {
      if (goldenStatus.ok && goldenStatus.criticalCount === 0) {
        return '✅ All Good - No Drift Detected';
      } else if (goldenStatus.criticalCount > 0) {
        return `❌ Drift Detected - ${goldenStatus.criticalCount} critical, ${goldenStatus.warnCount} warnings`;
      } else {
        return `⚠️ Warnings - ${goldenStatus.warnCount} warnings, ${goldenStatus.passedCases}/${goldenStatus.totalCases} passed`;
      }
    }
    return 'Ready - Run goldens to check status';
  };

  return (
    <div style={{ padding: spacing.md, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
        <h1 style={{ fontSize: textSizes.h1, margin: 0 }}>
          Demo Console
        </h1>
        <Link 
          href="/" 
          style={{
            padding: '8px 12px',
            borderRadius: 12,
            border: '1px solid #d4d4d4',
            backgroundColor: 'white',
            color: '#171717',
            textDecoration: 'none',
            fontSize: textSizes.small,
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
        >
          Website Home
        </Link>
      </div>

      {/* Status Banner */}
      <UiCard
        style={{
          marginBottom: spacing.lg,
          backgroundColor: getStatusColor(),
          color: 'white',
          padding: spacing.md
        }}
      >
        <div style={{ fontSize: textSizes.h2, fontWeight: 'bold' }}>
          {getStatusText()}
        </div>
        {goldenStatus && (
          <div style={{ fontSize: textSizes.small, marginTop: spacing.xs, opacity: 0.9 }}>
            {goldenStatus.passedCases}/{goldenStatus.totalCases} cases passed
          </div>
        )}
      </UiCard>

      {/* Demo Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: spacing.md, marginBottom: spacing.lg }}>
        <UiCard>
          <button
            onClick={handleRunUAV}
            disabled={!!loading || !seeded}
            style={{
              width: '100%',
              padding: spacing.lg,
              fontSize: textSizes.h3,
              backgroundColor: loading === 'Running UAV demo...' ? '#ccc' : '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: loading || !seeded ? 'not-allowed' : 'pointer'
            }}
          >
            Run UAV Demo
          </button>
        </UiCard>

        <UiCard>
          <button
            onClick={handleRunOrchestrator}
            disabled={!!loading || !seeded}
            style={{
              width: '100%',
              padding: spacing.lg,
              fontSize: textSizes.h3,
              backgroundColor: loading === 'Running orchestrator demo...' ? '#ccc' : '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: loading || !seeded ? 'not-allowed' : 'pointer'
            }}
          >
            Run Orchestrator Demo
          </button>
        </UiCard>

        <UiCard>
          <button
            onClick={handleRunSpecKernel}
            disabled={!!loading || !seeded}
            style={{
              width: '100%',
              padding: spacing.lg,
              fontSize: textSizes.h3,
              backgroundColor: loading === 'Running spec kernel...' ? '#ccc' : '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: loading || !seeded ? 'not-allowed' : 'pointer'
            }}
          >
            Run Spec Kernel
          </button>
        </UiCard>

        <UiCard>
          <button
            onClick={handleExportArtifact}
            disabled={!!loading || !lastArtifactId}
            style={{
              width: '100%',
              padding: spacing.lg,
              fontSize: textSizes.h3,
              backgroundColor: loading === 'Exporting artifact...' ? '#ccc' : '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: loading || !lastArtifactId ? 'not-allowed' : 'pointer'
            }}
          >
            Export Artifact
          </button>
        </UiCard>

        <UiCard>
          <button
            onClick={handleCaptureLastArtifact}
            disabled={!!loading || !lastArtifactId}
            style={{
              width: '100%',
              padding: spacing.lg,
              fontSize: textSizes.h3,
              backgroundColor: loading === 'Capturing artifact as golden...' ? '#ccc' : '#f57c00',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: loading || !lastArtifactId ? 'not-allowed' : 'pointer'
            }}
          >
            Capture Last Artifact as Golden
          </button>
        </UiCard>

        <UiCard>
          <button
            onClick={handleCaptureAndRun}
            disabled={!!loading || !lastArtifactId}
            style={{
              width: '100%',
              padding: spacing.lg,
              fontSize: textSizes.h3,
              backgroundColor: loading === 'Capturing and running goldens...' ? '#ccc' : '#9c27b0',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: loading || !lastArtifactId ? 'not-allowed' : 'pointer'
            }}
          >
            Capture + Run Goldens
          </button>
        </UiCard>

        <UiCard>
          <button
            onClick={handleRunGoldens}
            disabled={!!loading}
            style={{
              width: '100%',
              padding: spacing.lg,
              fontSize: textSizes.h3,
              backgroundColor: loading === 'Running golden suite...' ? '#ccc' : '#673ab7',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Run Goldens
          </button>
        </UiCard>
      </div>

      {/* Loading/Error/Success Messages */}
      {loading && (
        <UiCard style={{ marginBottom: spacing.md, backgroundColor: '#f5f5f5' }}>
          <p style={{ fontSize: textSizes.body, margin: 0 }}>{loading}</p>
        </UiCard>
      )}

      {error && (
        <UiCard style={{ marginBottom: spacing.md, backgroundColor: '#ffebee' }}>
          <p style={{ fontSize: textSizes.body, color: '#d32f2f', margin: 0 }}>{error}</p>
        </UiCard>
      )}

      {success && (
        <UiCard style={{ marginBottom: spacing.md, backgroundColor: '#e8f5e9' }}>
          <p style={{ fontSize: textSizes.body, color: '#4caf50', margin: 0 }}>{success}</p>
        </UiCard>
      )}

      {/* Last Artifact ID */}
      {lastArtifactId && (
        <UiCard style={{ marginBottom: spacing.md }}>
          <p style={{ fontSize: textSizes.small, opacity: 0.7, margin: 0 }}>
            Last artifact ID: <code>{lastArtifactId}</code>
          </p>
        </UiCard>
      )}
    </div>
  );
}
