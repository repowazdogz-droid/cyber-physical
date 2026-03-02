'use client';

import React, { useState } from 'react';
import { SPACING, MAX_LINE_WIDTH, TEXT_SIZES, TAP_MIN_PX } from '../../learning/ui/uiTokens';
import UiCard from '../../learning/ui/UiCard';
import PrimaryActionBar from '../../learning/ui/PrimaryActionBar';

export default function TeacherRemotePage() {
  const [learnerId, setLearnerId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [pinnedThoughts, setPinnedThoughts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customThoughtId, setCustomThoughtId] = useState('');

  const handleLoadPinned = async () => {
    if (!sessionId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/learning/presence/state?sessionId=${encodeURIComponent(sessionId)}`);
      if (response.ok) {
        const state = await response.json();
        setPinnedThoughts(state.pinnedIds || []);
      }
    } catch (err: any) {
      // Ignore errors - pinned thoughts optional
    } finally {
      setLoading(false);
    }
  };

  const handleSpotlight = async (thoughtId: string) => {
    if (!sessionId || !learnerId) {
      setError('Session ID and Learner ID required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/learning/remoteCommand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          learnerId,
          commandType: 'spotlight_show',
          thoughtId,
          role: 'teacher'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send command');
      }

      setSuccess('Spotlight command sent');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to send command');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    if (!sessionId || !learnerId) {
      setError('Session ID and Learner ID required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/learning/remoteCommand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          learnerId,
          commandType: 'spotlight_dismiss',
          role: 'teacher'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send command');
      }

      setSuccess('Dismiss command sent');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to send command');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: SPACING.standard.md, maxWidth: MAX_LINE_WIDTH, margin: '0 auto' }}>
      <h1 style={{ fontSize: TEXT_SIZES.heading, marginBottom: SPACING.large }}>
        Teacher Remote
      </h1>

      <p style={{ fontSize: TEXT_SIZES.body, marginBottom: SPACING.large, opacity: 0.7 }}>
        Spotlight thoughts (opt-in only). Learner can always dismiss.
      </p>

      {/* Inputs */}
      <UiCard style={{ marginBottom: SPACING.large }}>
        <div style={{ marginBottom: SPACING.standard.md }}>
          <label style={{ display: 'block', marginBottom: SPACING.small, fontSize: TEXT_SIZES.body }}>
            Learner ID
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
            Session ID
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
            placeholder="e.g., session_20240101120000"
          />
        </div>

        <button
          onClick={handleLoadPinned}
          disabled={loading || !sessionId}
          style={{
            padding: SPACING.standard.md,
            fontSize: TEXT_SIZES.body,
            backgroundColor: '#f5f5f5',
            border: '1px solid #ccc',
            borderRadius: 4,
            cursor: loading || !sessionId ? 'not-allowed' : 'pointer',
            width: '100%',
            marginBottom: SPACING.standard.md
          }}
        >
          Load Pinned Thoughts
        </button>
      </UiCard>

      {/* Error */}
      {error && (
        <UiCard style={{ marginBottom: SPACING.large, backgroundColor: '#ffebee' }}>
          <p style={{ color: '#d32f2f', fontSize: TEXT_SIZES.body }}>{error}</p>
        </UiCard>
      )}

      {/* Success */}
      {success && (
        <UiCard style={{ marginBottom: SPACING.large, backgroundColor: '#e8f5e9' }}>
          <p style={{ color: '#2e7d32', fontSize: TEXT_SIZES.body }}>{success}</p>
        </UiCard>
      )}

      {/* Pinned thoughts */}
      {pinnedThoughts.length > 0 && (
        <UiCard style={{ marginBottom: SPACING.large }}>
          <h2 style={{ fontSize: TEXT_SIZES.subheading, marginBottom: SPACING.standard.md }}>
            Spotlight this pinned thought
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING.small }}>
            {pinnedThoughts.map((id, idx) => (
              <button
                key={idx}
                onClick={() => handleSpotlight(id)}
                disabled={loading}
                style={{
                  padding: SPACING.standard.md,
                  fontSize: TEXT_SIZES.body,
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  minHeight: TAP_MIN_PX
                }}
              >
                {id.substring(0, 12)}...
              </button>
            ))}
          </div>
        </UiCard>
      )}

      {/* Dismiss */}
      <UiCard style={{ marginBottom: SPACING.large }}>
        <PrimaryActionBar
          primaryLabel="Dismiss Spotlight"
          onPrimary={handleDismiss}
          readingMode="standard"
          calmMode={true}
        />
      </UiCard>

      {/* Advanced */}
      <UiCard>
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
          {showAdvanced ? '▼' : '▶'} Advanced
        </button>

        {showAdvanced && (
          <div style={{ marginTop: SPACING.standard.md }}>
            <div style={{ marginBottom: SPACING.standard.md }}>
              <label style={{ display: 'block', marginBottom: SPACING.small, fontSize: TEXT_SIZES.body }}>
                Custom Thought ID
              </label>
              <input
                type="text"
                value={customThoughtId}
                onChange={(e) => setCustomThoughtId(e.target.value)}
                style={{
                  width: '100%',
                  padding: SPACING.small,
                  fontSize: TEXT_SIZES.body,
                  border: '1px solid #ccc',
                  borderRadius: 4
                }}
                placeholder="e.g., thought_123"
              />
            </div>
            <button
              onClick={() => handleSpotlight(customThoughtId)}
              disabled={loading || !customThoughtId}
              style={{
                padding: SPACING.standard.md,
                fontSize: TEXT_SIZES.body,
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: loading || !customThoughtId ? 'not-allowed' : 'pointer',
                width: '100%'
              }}
            >
              Spotlight Custom ID
            </button>
          </div>
        )}
      </UiCard>

      {/* Trust message */}
      <div style={{ marginTop: SPACING.large, padding: SPACING.standard.md, backgroundColor: '#fff3e0', borderRadius: 4 }}>
        <p style={{ fontSize: TEXT_SIZES.small, margin: 0, opacity: 0.8 }}>
          <strong>Remember:</strong> Learner is in control. They can dismiss spotlight anytime. 
          Adult learners must opt in for remote access.
        </p>
      </div>
    </div>
  );
}








































