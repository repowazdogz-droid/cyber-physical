'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getEventLabel, summarizeEvents } from '../eventLabels';
import { SPACING, MAX_LINE_WIDTH, TEXT_SIZES } from '../../ui/uiTokens';
import UiCard from '../../ui/UiCard';
import RecapEmptyState from '../components/RecapEmptyState';
import NextStepsCard from '../components/NextStepsCard';
import IntegrityPanel from './IntegrityPanel';
import CaptureAsGoldenButton from '../../../surfaces/explainable/components/CaptureAsGoldenButton';
import { hashString } from '../../../../spine/learning/platform/session/hash';

interface SessionLog {
  sessionId: string;
  version: string;
  startedAtIso: string;
  events: Array<{
    t: number;
    type: string;
    payload: any;
  }>;
}

interface BoardState {
  pinnedIds: string[];
  customOrderIds: string[];
  layoutMode: string;
}

interface ThoughtObject {
  id: string;
  type: string;
  contentText: string;
  source?: string;
  confidence?: string;
  relatedStepId?: string;
  timestampIso?: string;
  ephemeral?: boolean;
}

interface BundleMeta {
  sessionId: string;
  createdAtIso: string;
  version: string;
  modeUsed: string;
  reduceMotion: boolean;
  learnerIdHash?: string;
}

export default function RecapPage() {
  const params = useParams() as { sessionId: string };
  const sessionId = params.sessionId;

  const [meta, setMeta] = useState<BundleMeta | null>(null);
  const [sessionLog, setSessionLog] = useState<SessionLog | null>(null);
  const [boardState, setBoardState] = useState<BoardState | null>(null);
  const [thoughtObjects, setThoughtObjects] = useState<ThoughtObject[]>([]);
  const [highlightReel, setHighlightReel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'not_found' | 'not_imported' | 'load_failed' | 'partial'>('not_found');
  const [playingHighlight, setPlayingHighlight] = useState(false);
  const [currentMomentIndex, setCurrentMomentIndex] = useState(0);
  const [artifactId, setArtifactId] = useState<string | null>(null);

  // Highlight playback effect - must be before any returns
  useEffect(() => {
    if (playingHighlight && highlightReel && currentMomentIndex < highlightReel.moments.length) {
      const moment = highlightReel.moments[currentMomentIndex];
      const holdDuration = moment?.holdDurationMs || 2000;

      const timer = setTimeout(() => {
        if (currentMomentIndex < highlightReel.moments.length - 1) {
          setCurrentMomentIndex(currentMomentIndex + 1);
        } else {
          setPlayingHighlight(false);
          setCurrentMomentIndex(0);
        }
      }, holdDuration);

      return () => clearTimeout(timer);
    }
  }, [playingHighlight, currentMomentIndex, highlightReel]);

  useEffect(() => {
    async function loadBundle() {
      try {
        // Check if artifactId is present in query (preferred)
        const urlParams = new URLSearchParams(window.location.search);
        const queryArtifactId = urlParams.get('artifactId');

        if (queryArtifactId) {
          setArtifactId(queryArtifactId);
          // Load from artifact vault
          const response = await fetch(`/api/artifacts/${queryArtifactId}`);
          if (!response.ok) {
            throw new Error('Artifact not found');
          }

          const data = await response.json();
          const payloads = data.payloads;
          
          // Ensure meta has learnerIdHash
          const metaWithHash = payloads.meta ? {
            ...payloads.meta,
            learnerIdHash: payloads.meta.learnerIdHash || (payloads.meta.sessionId ? hashString(payloads.meta.sessionId.split('_')[1] || payloads.meta.sessionId) : '')
          } : null;
          
          setMeta(metaWithHash);
          setSessionLog(payloads.sessionlog);
          setBoardState(payloads.learningBoard);
          setThoughtObjects(payloads.thoughtObjects || []);
        } else {
          // Fallback to legacy sessionId storage (dev only)
          const response = await fetch(`/api/learning/bundle/${sessionId}`);
          if (!response.ok) {
            throw new Error('Bundle not found');
          }

          const data = await response.json();
          // Ensure meta has learnerIdHash
          const metaWithHash = data.meta ? {
            ...data.meta,
            learnerIdHash: data.meta.learnerIdHash || (data.meta.sessionId ? hashString(data.meta.sessionId.split('_')[1] || data.meta.sessionId) : '')
          } : null;
          
          setMeta(metaWithHash);
          setSessionLog(data.sessionLog);
          setBoardState(data.boardState);
          setThoughtObjects(data.thoughtObjects || []);
        }

        // Load highlight reel if available
        try {
          const highlightResponse = await fetch(`/api/learning/bundle/${sessionId}/highlight`);
          if (highlightResponse.ok) {
            const highlight = await highlightResponse.json();
            setHighlightReel(highlight);
          }
        } catch (e) {
          // Highlight reel is optional
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load bundle');
        // Determine error type
        if (err.message?.includes('not found') || err.message?.includes('404')) {
          setErrorType('not_found');
        } else if (err.message?.includes('import')) {
          setErrorType('not_imported');
        } else {
          setErrorType('load_failed');
        }
      } finally {
        setLoading(false);
      }
    }

    if (sessionId) {
      loadBundle();
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div style={{ padding: SPACING.standard.md, maxWidth: MAX_LINE_WIDTH, margin: '0 auto' }}>
        <p>Loading recap...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: SPACING.standard.md, maxWidth: MAX_LINE_WIDTH, margin: '0 auto' }}>
        <h1>Recap</h1>
        <p style={{ color: '#d32f2f' }}>{error}</p>
      </div>
    );
  }

  // Get timeline events (max 20)
  const timelineEvents = sessionLog?.events
    ?.slice(0, 20)
    .map(event => ({
      ...event,
      label: getEventLabel(event.type)
    })) || [];

  // Get pinned thought objects
  const pinnedObjects = thoughtObjects.filter(obj =>
    boardState?.pinnedIds?.includes(obj.id)
  );

  // Get explain-back moments
  const explainBackMoments = sessionLog?.events
    ?.filter(e => e.type === 'ExplainBackShown')
    .map(e => ({
      event: e,
      thought: thoughtObjects.find(obj => obj.id === e.payload?.thoughtId)
    }))
    .filter(item => item.thought) || [];

  // Get process summary
  const processSummary = sessionLog?.events
    ? summarizeEvents(sessionLog.events)
    : [];

  return (
    <div style={{ padding: SPACING.standard.md, maxWidth: MAX_LINE_WIDTH, margin: '0 auto' }}>
      <h1 style={{ fontSize: TEXT_SIZES.heading, marginBottom: SPACING.large }}>
        Learning Recap
      </h1>

      {/* UAV Demo Banner */}
      {sessionId && sessionId.startsWith('uav-demo-') && (
        <UiCard style={{ marginBottom: SPACING.large, backgroundColor: '#fff3e0', border: '1px solid #ff9800' }}>
          <p style={{ fontSize: TEXT_SIZES.body, margin: 0, fontWeight: 'bold' }}>
            This is a decision kernel replay (no grading)
          </p>
          <p style={{ fontSize: TEXT_SIZES.small, margin: SPACING.small + ' 0 0 0', opacity: 0.7 }}>
            Shows the decision process and reasoning, not performance or scores.
          </p>
        </UiCard>
      )}

      {meta && (
        <div style={{ marginBottom: SPACING.large, opacity: 0.7 }}>
          <p style={{ fontSize: TEXT_SIZES.body }}>
            Session: {new Date(meta.createdAtIso).toLocaleDateString()}
            {meta.modeUsed && ` • Mode: ${meta.modeUsed}`}
          </p>
        </div>
      )}

      {/* What happened */}
      <UiCard>
        <h2 style={{ fontSize: TEXT_SIZES.subheading, marginBottom: SPACING.standard.md }}>
          What happened
        </h2>
        {timelineEvents.length > 0 ? (
          <div>
            {timelineEvents.map((event, idx) => (
              <div
                key={idx}
                style={{
                  padding: SPACING.small,
                  marginBottom: SPACING.small,
                  borderLeft: '3px solid #e0e0e0',
                  paddingLeft: SPACING.standard
                }}
              >
                <p style={{ fontSize: TEXT_SIZES.body, margin: 0 }}>
                  <strong>{event.label.label}</strong>
                  {event.label.description && (
                    <span style={{ opacity: 0.7, marginLeft: SPACING.small }}>
                      {event.label.description}
                    </span>
                  )}
                </p>
                <p style={{ fontSize: TEXT_SIZES.small, opacity: 0.5, margin: 0, marginTop: 4 }}>
                  {Math.round(event.t / 1000)}s into session
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: TEXT_SIZES.body, opacity: 0.7 }}>
            No events recorded
          </p>
        )}
      </UiCard>

      {/* What they worked with */}
      {pinnedObjects.length > 0 && (
        <UiCard style={{ marginTop: SPACING.large }}>
          <h2 style={{ fontSize: TEXT_SIZES.subheading, marginBottom: SPACING.standard.md }}>
            What they worked with
          </h2>
          <div>
            {pinnedObjects.map(obj => (
              <div
                key={obj.id}
                style={{
                  padding: SPACING.standard.md,
                  marginBottom: SPACING.small,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 8
                }}
              >
                <p style={{ fontSize: TEXT_SIZES.body, margin: 0 }}>
                  <strong>{obj.type}:</strong> {obj.contentText}
                </p>
              </div>
            ))}
          </div>
        </UiCard>
      )}

      {/* Explain-back moments */}
      {explainBackMoments.length > 0 && (
        <UiCard style={{ marginTop: SPACING.large }}>
          <h2 style={{ fontSize: TEXT_SIZES.subheading, marginBottom: SPACING.standard.md }}>
            Explain-back moments
          </h2>
          <div>
            {explainBackMoments.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: SPACING.standard.md,
                  marginBottom: SPACING.small,
                  borderLeft: '3px solid #4caf50',
                  paddingLeft: SPACING.standard
                }}
              >
                <p style={{ fontSize: TEXT_SIZES.body, margin: 0 }}>
                  Explained: <strong>{item.thought?.contentText}</strong>
                </p>
                <p style={{ fontSize: TEXT_SIZES.small, opacity: 0.7, margin: 0, marginTop: 4 }}>
                  {Math.round(item.event.t / 1000)}s into session
                </p>
              </div>
            ))}
          </div>
        </UiCard>
      )}

      {/* Process summary */}
      {processSummary.length > 0 && (
        <UiCard style={{ marginTop: SPACING.large }}>
          <h2 style={{ fontSize: TEXT_SIZES.subheading, marginBottom: SPACING.standard.md }}>
            Process summary
          </h2>
          <div>
            {processSummary.map((item, idx) => (
              <p
                key={idx}
                style={{
                  fontSize: TEXT_SIZES.body,
                  margin: 0,
                  marginBottom: SPACING.small,
                  paddingLeft: SPACING.standard
                }}
              >
                • {item}
              </p>
            ))}
          </div>
        </UiCard>
      )}

      {/* No grades, no scores message */}
      <div style={{ marginTop: SPACING.large, padding: SPACING.standard.md, opacity: 0.7 }}>
        <p style={{ fontSize: TEXT_SIZES.small, fontStyle: 'italic' }}>
          This recap shows what happened. It doesn&apos;t grade or judge.
        </p>
      </div>

      {/* Highlights section */}
      {highlightReel && highlightReel.moments && highlightReel.moments.length > 0 && (
        <UiCard style={{ marginTop: SPACING.large }}>
          <h2 style={{ fontSize: TEXT_SIZES.subheading, marginBottom: SPACING.standard.md }}>
            Highlights
          </h2>
          
          {!playingHighlight ? (
            <>
              <div style={{ marginBottom: SPACING.standard.md }}>
                {highlightReel.moments.map((moment: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      padding: SPACING.small,
                      marginBottom: SPACING.small,
                      borderLeft: '3px solid #4caf50',
                      paddingLeft: SPACING.standard.md,
                      backgroundColor: '#f5f5f5',
                      borderRadius: 4
                    }}
                  >
                    <p style={{ fontSize: TEXT_SIZES.body, margin: 0 }}>
                      <strong>{moment.caption}</strong>
                    </p>
                    <p style={{ fontSize: TEXT_SIZES.small, opacity: 0.7, margin: 0, marginTop: 4 }}>
                      {Math.round(moment.t / 1000)}s
                    </p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  setPlayingHighlight(true);
                  setCurrentMomentIndex(0);
                }}
                style={{
                  padding: SPACING.standard.md,
                  fontSize: TEXT_SIZES.body,
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Play Highlights ({Math.round((highlightReel.durationMs || 0) / 1000)}s)
              </button>
            </>
          ) : (
            <div>
              {currentMomentIndex < highlightReel.moments.length && (
                <div style={{ padding: SPACING.standard.md, backgroundColor: '#e3f2fd', borderRadius: 4 }}>
                  <p style={{ fontSize: TEXT_SIZES.body, fontWeight: 'bold', margin: 0 }}>
                    {highlightReel.moments[currentMomentIndex].caption}
                  </p>
                  {highlightReel.moments[currentMomentIndex].thoughtId && (
                    <div style={{ marginTop: SPACING.small }}>
                      {thoughtObjects
                        .filter(obj => obj.id === highlightReel.moments[currentMomentIndex].thoughtId)
                        .map(obj => (
                          <div
                            key={obj.id}
                            style={{
                              padding: SPACING.small,
                              marginTop: SPACING.small,
                              backgroundColor: 'white',
                              borderRadius: 4,
                              border: '2px solid #4caf50'
                            }}
                          >
                            <p style={{ fontSize: TEXT_SIZES.body, margin: 0 }}>
                              <strong>{obj.type}:</strong> {obj.contentText}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => {
                  setPlayingHighlight(false);
                  setCurrentMomentIndex(0);
                }}
                style={{
                  padding: SPACING.standard.md,
                  fontSize: TEXT_SIZES.body,
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  cursor: 'pointer',
                  width: '100%',
                  marginTop: SPACING.standard.md
                }}
              >
                Stop
              </button>
            </div>
          )}
        </UiCard>
      )}

      {/* Next steps */}
      <NextStepsCard
        sessionId={sessionId}
        learnerId={meta?.learnerIdHash}
        role="learner"
      />

      {/* Integrity Panel */}
      <IntegrityPanel sessionId={sessionId} />

      {/* Capture as Golden (only if artifactId exists) */}
      {artifactId && (
        <UiCard style={{ marginBottom: SPACING.large }}>
          <CaptureAsGoldenButton
            artifactId={artifactId}
            defaultLabel={`Recap: ${sessionId.substring(0, 20)}`}
            runSuite={false}
          />
        </UiCard>
      )}

      {/* Share Recap Button */}
      <UiCard style={{ marginBottom: SPACING.large }}>
        <button
          onClick={async () => {
            try {
              // Check if we have an artifactId (preferred)
              const urlParams = new URLSearchParams(window.location.search);
              const artifactId = urlParams.get('artifactId') || sessionId;

              const response = await fetch('/api/share/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  scope: 'SESSION_RECAP',
                  learnerId: meta?.learnerIdHash || 'unknown',
                  sessionId: artifactId, // Use artifactId as sessionId for share token
                  ttlMinutes: 60
                })
              });

              if (response.ok) {
                const data = await response.json();
                // Include artifactId in share URL if available
                const shareUrl = artifactId !== sessionId 
                  ? `${data.shareUrl}&artifactId=${artifactId}`
                  : data.shareUrl;
                await navigator.clipboard.writeText(shareUrl);
                alert('Share link copied to clipboard!');
              } else {
                const data = await response.json();
                alert(`Failed to create share link: ${data.error}`);
              }
            } catch (err) {
              alert('Failed to create share link');
            }
          }}
          style={{
            padding: SPACING.standard.md,
            fontSize: TEXT_SIZES.body,
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Share this recap
        </button>
      </UiCard>

      {/* Teacher view link */}
      <div style={{ marginTop: SPACING.large }}>
        <a
          href={`/teacher/recap?sessionId=${sessionId}${meta?.sessionId ? `&learnerId=${meta.sessionId.split('_')[1] || ''}` : ''}`}
          style={{
            display: 'inline-block',
            padding: SPACING.standard.md,
            fontSize: TEXT_SIZES.body,
            backgroundColor: '#f5f5f5',
            border: '1px solid #ccc',
            borderRadius: 4,
            textDecoration: 'none',
            color: '#1976d2'
          }}
        >
          Teacher view (requires permission)
        </a>
      </div>
    </div>
  );
}
