'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SPACING, MAX_LINE_WIDTH, TEXT_SIZES } from '../../learning/ui/uiTokens';
import UiCard from '../../learning/ui/UiCard';

interface PresenceState {
  sessionId: string;
  focusedThoughtId?: string;
  clusterId?: string;
  pinnedIds?: string[];
  spotlightThoughtId?: string;
  demoStepIndex?: number;
  updatedAtMs: number;
}

export default function AudiencePage() {
  const params = useParams();
  const sessionId = params?.sessionId as string;
  const [state, setState] = useState<PresenceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState(true);
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    if (!sessionId) {
      setError('Session ID required');
      setLoading(false);
      return;
    }

    // Poll for presence state
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/learning/presence/state?sessionId=${encodeURIComponent(sessionId)}`);
        if (response.ok) {
          const data: PresenceState = await response.json();
          setState(data);
          setError(null);

          // Track events (max 8)
          if (data.clusterId && (!state || state.clusterId !== data.clusterId)) {
            setEvents(prev => [`Filtered to ${data.clusterId}`, ...prev].slice(0, 8));
          }
          if (data.focusedThoughtId && (!state || state.focusedThoughtId !== data.focusedThoughtId)) {
            setEvents(prev => ['Focused on thought', ...prev].slice(0, 8));
          }
          if (data.spotlightThoughtId && (!state || state.spotlightThoughtId !== data.spotlightThoughtId)) {
            setEvents(prev => ['Spotlight shown', ...prev].slice(0, 8));
          }
        } else if (response.status === 404) {
          setError('Session not found');
        } else if (response.status === 410) {
          setError('Session expired');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load state');
      } finally {
        setLoading(false);
      }
    }, 1000); // Poll every 1s

    return () => clearInterval(pollInterval);
  }, [sessionId, state]);

  const getThoughtTypeLabel = (thoughtId?: string) => {
    if (!thoughtId) return 'None';
    // Would resolve from thought objects if available
    // For now, return ID prefix
    return thoughtId.split('-')[0] || 'Thought';
  };

  return (
    <div style={{ 
      padding: SPACING.large, 
      maxWidth: '100%', 
      margin: 0,
      backgroundColor: '#000',
      color: '#fff',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto'
    }}>
      <div style={{ maxWidth: MAX_LINE_WIDTH, margin: '0 auto' }}>
        <div style={{ marginBottom: SPACING.large, textAlign: 'right' }}>
          <button
            onClick={() => setReduceMotion(!reduceMotion)}
            style={{
              padding: SPACING.small,
              fontSize: TEXT_SIZES.small,
              backgroundColor: 'transparent',
              border: '1px solid #666',
              borderRadius: 4,
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            {reduceMotion ? 'Reduce motion: ON' : 'Reduce motion: OFF'}
          </button>
        </div>

        {/* Now */}
        <UiCard style={{ 
          marginBottom: SPACING.large, 
          backgroundColor: '#1a1a1a',
          border: '1px solid #333'
        }}>
          <h1 style={{ 
            fontSize: reduceMotion ? 72 : 96, 
            marginBottom: SPACING.standard.md,
            fontWeight: 'bold'
          }}>
            Now
          </h1>
          <div style={{ fontSize: reduceMotion ? 36 : 48, marginBottom: SPACING.standard.md }}>
            <p style={{ margin: 0, opacity: 0.7 }}>Cluster:</p>
            <p style={{ margin: 0, fontWeight: 'bold' }}>{state?.clusterId || 'All'}</p>
          </div>
          <div style={{ fontSize: reduceMotion ? 36 : 48 }}>
            <p style={{ margin: 0, opacity: 0.7 }}>Focused:</p>
            <p style={{ margin: 0, fontWeight: 'bold' }}>{getThoughtTypeLabel(state?.focusedThoughtId)}</p>
          </div>
          {state?.spotlightThoughtId && (
            <div style={{ 
              marginTop: SPACING.standard.md, 
              padding: SPACING.standard.md, 
              backgroundColor: '#4caf50',
              borderRadius: 4
            }}>
              <p style={{ fontSize: reduceMotion ? 24 : 32, margin: 0, fontWeight: 'bold' }}>
                Spotlight: {getThoughtTypeLabel(state.spotlightThoughtId)}
              </p>
            </div>
          )}
        </UiCard>

        {/* Pinned */}
        {state?.pinnedIds && state.pinnedIds.length > 0 && (
          <UiCard style={{ 
            marginBottom: SPACING.large,
            backgroundColor: '#1a1a1a',
            border: '1px solid #333'
          }}>
            <h2 style={{ fontSize: reduceMotion ? 48 : 64, marginBottom: SPACING.standard.md }}>
              Pinned
            </h2>
            <div style={{ fontSize: reduceMotion ? 24 : 32 }}>
              {state.pinnedIds.map((id, idx) => (
                <p key={idx} style={{ margin: 0, marginBottom: SPACING.small }}>
                  {getThoughtTypeLabel(id)}
                </p>
              ))}
            </div>
          </UiCard>
        )}

        {/* What happened */}
        {events.length > 0 && (
          <UiCard style={{ 
            backgroundColor: '#1a1a1a',
            border: '1px solid #333'
          }}>
            <h2 style={{ fontSize: reduceMotion ? 48 : 64, marginBottom: SPACING.standard.md }}>
              What happened
            </h2>
            <div style={{ fontSize: reduceMotion ? 24 : 32 }}>
              {events.map((event, idx) => (
                <p key={idx} style={{ margin: 0, marginBottom: SPACING.small, opacity: 0.8 }}>
                  {event}
                </p>
              ))}
            </div>
          </UiCard>
        )}

        {/* Error */}
        {error && (
          <UiCard style={{ 
            marginTop: SPACING.large,
            backgroundColor: '#4a1a1a',
            border: '1px solid #d32f2f'
          }}>
            <p style={{ fontSize: reduceMotion ? 36 : 48, color: '#ff5252', margin: 0 }}>
              {error}
            </p>
          </UiCard>
        )}

        {/* Loading */}
        {loading && !state && (
          <UiCard style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
            <p style={{ fontSize: reduceMotion ? 36 : 48, margin: 0 }}>
              Loading...
            </p>
          </UiCard>
        )}
      </div>
    </div>
  );
}








































