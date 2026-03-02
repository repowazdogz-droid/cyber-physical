'use client';

import React, { useState } from 'react';
import { TeacherMoment, TeacherPrompt, PlanStep } from '../../learning/teacher/TeacherMomentTypes';
import { SPACING, MAX_LINE_WIDTH, TEXT_SIZES } from '../../learning/ui/uiTokens';
import UiCard from '../../learning/ui/UiCard';
import NextStepsCard from '../../learning/recap/components/NextStepsCard';

interface TeacherRecapData {
  allowed: boolean;
  visibilityNote?: string;
  teacherMoments?: TeacherMoment[];
  nextPrompts?: TeacherPrompt[];
  nextSessionPlan?: PlanStep[];
  summary?: string[];
}

export default function TeacherRecapPage() {
  const [learnerId, setLearnerId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [role, setRole] = useState<'teacher' | 'parent'>('teacher');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TeacherRecapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);

  const handleLoadRecap = async () => {
    if (!learnerId) {
      setError('Learner ID is required');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const url = `/api/learning/teacherRecap?learnerId=${encodeURIComponent(learnerId)}${sessionId ? `&sessionId=${encodeURIComponent(sessionId)}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load recap');
      }

      const recapData: TeacherRecapData = await response.json();

      if (!recapData.allowed) {
        setData(recapData);
        return;
      }

      setData(recapData);
    } catch (err: any) {
      setError(err.message || 'Failed to load recap');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async () => {
    if (!learnerId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/learning/teacherAccess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learnerId,
          sessionId: sessionId || undefined,
          action: 'request',
          role
        })
      });

      const result = await response.json();
      
      if (result.requestId) {
        setRequestId(result.requestId);
        setRequestMessage(result.message || 'Access request created');
      } else {
        setError(result.reason || 'Failed to create request');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request access');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
  };

  const handleCopyAllPrompts = () => {
    if (!data?.nextPrompts) return;
    const allPrompts = data.nextPrompts.map(p => p.prompt).join('\n');
    navigator.clipboard.writeText(allPrompts);
  };

  return (
    <div style={{ padding: SPACING.standard.md, maxWidth: MAX_LINE_WIDTH, margin: '0 auto' }}>
      <h1 style={{ fontSize: TEXT_SIZES.heading, marginBottom: SPACING.large }}>
        Teacher Recap
      </h1>

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
            placeholder="e.g., learner_123 or learner_minor_456"
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
            placeholder="e.g., session_20240101120000"
          />
        </div>

        <div style={{ marginBottom: SPACING.standard.md }}>
          <label style={{ display: 'block', marginBottom: SPACING.small, fontSize: TEXT_SIZES.body }}>
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'teacher' | 'parent')}
            style={{
              width: '100%',
              padding: SPACING.small,
              fontSize: TEXT_SIZES.body,
              border: '1px solid #ccc',
              borderRadius: 4
            }}
          >
            <option value="teacher">Teacher</option>
            <option value="parent">Parent</option>
          </select>
        </div>

        <button
          onClick={handleLoadRecap}
          disabled={loading}
          style={{
            padding: SPACING.standard.md,
            fontSize: TEXT_SIZES.body,
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer',
            width: '100%'
          }}
        >
          {loading ? 'Loading...' : 'Load Teacher Recap'}
        </button>
      </UiCard>

      {/* Error */}
      {error && (
        <UiCard style={{ marginBottom: SPACING.large, backgroundColor: '#ffebee' }}>
          <p style={{ color: '#d32f2f', fontSize: TEXT_SIZES.body }}>{error}</p>
        </UiCard>
      )}

      {/* Access not granted */}
      {data && !data.allowed && (
        <UiCard style={{ marginBottom: SPACING.large }}>
          <h2 style={{ fontSize: TEXT_SIZES.subheading, marginBottom: SPACING.standard.md }}>
            Access not granted
          </h2>
          <p style={{ fontSize: TEXT_SIZES.body, marginBottom: SPACING.standard.md }}>
            {data.visibilityNote || 'This learner has not granted access.'}
          </p>
          <div style={{ marginBottom: SPACING.standard.md, padding: SPACING.standard.md, backgroundColor: '#fff3e0', borderRadius: 4 }}>
            <p style={{ fontSize: TEXT_SIZES.small, margin: 0, opacity: 0.8 }}>
              <strong>Remember:</strong> Learner is in control. You can&apos;t see adult sessions unless they opt in.
            </p>
          </div>
          {requestMessage && (
            <div style={{ marginBottom: SPACING.standard.md, padding: SPACING.standard.md, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
              <p style={{ fontSize: TEXT_SIZES.body }}>{requestMessage}</p>
            </div>
          )}
          <button
            onClick={handleRequestAccess}
            disabled={loading}
            style={{
              padding: SPACING.standard.md,
              fontSize: TEXT_SIZES.body,
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Request Access
          </button>
        </UiCard>
      )}

      {/* Teacher recap data */}
      {data && data.allowed && (
        <>
          {data.visibilityNote && (
            <div style={{ marginBottom: SPACING.standard.md, padding: SPACING.small, backgroundColor: '#e3f2fd', borderRadius: 4 }}>
              <p style={{ fontSize: TEXT_SIZES.small, opacity: 0.7 }}>{data.visibilityNote}</p>
            </div>
          )}

          {/* Key moments */}
          {data.teacherMoments && data.teacherMoments.length > 0 && (
            <UiCard style={{ marginBottom: SPACING.large }}>
              <h2 style={{ fontSize: TEXT_SIZES.subheading, marginBottom: SPACING.standard.md }}>
                Key moments
              </h2>
              <div>
                {data.teacherMoments.map((moment, idx) => (
                  <div
                    key={moment.id}
                    style={{
                      padding: SPACING.standard.md,
                      marginBottom: SPACING.small,
                      borderLeft: '3px solid #4caf50',
                      paddingLeft: SPACING.standard,
                      backgroundColor: '#f5f5f5',
                      borderRadius: 4
                    }}
                  >
                    <p style={{ fontSize: TEXT_SIZES.body, fontWeight: 'bold', margin: 0 }}>
                      {moment.label}
                    </p>
                    <p style={{ fontSize: TEXT_SIZES.small, opacity: 0.7, margin: 0, marginTop: 4 }}>
                      {moment.whyItMatters}
                    </p>
                  </div>
                ))}
              </div>
            </UiCard>
          )}

          {/* Suggested prompts */}
          {data.nextPrompts && data.nextPrompts.length > 0 && (
            <UiCard style={{ marginBottom: SPACING.large }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.standard.md }}>
                <h2 style={{ fontSize: TEXT_SIZES.subheading, margin: 0 }}>
                  Suggested prompts
                </h2>
                <button
                  onClick={handleCopyAllPrompts}
                  style={{
                    padding: SPACING.small,
                    fontSize: TEXT_SIZES.small,
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #ccc',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Copy all
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING.small }}>
                {data.nextPrompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => handleCopyPrompt(prompt.prompt)}
                    style={{
                      padding: SPACING.small,
                      fontSize: TEXT_SIZES.body,
                      backgroundColor: '#e3f2fd',
                      border: '1px solid #90caf9',
                      borderRadius: 4,
                      cursor: 'pointer',
                      maxWidth: '100%'
                    }}
                    title="Click to copy"
                  >
                    {prompt.prompt}
                  </button>
                ))}
              </div>
            </UiCard>
          )}

          {/* Next session plan */}
          {data.nextSessionPlan && data.nextSessionPlan.length > 0 && (
            <UiCard style={{ marginBottom: SPACING.large }}>
              <h2 style={{ fontSize: TEXT_SIZES.subheading, marginBottom: SPACING.standard.md }}>
                Next session plan
              </h2>
              <div>
                {data.nextSessionPlan.map((step, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: SPACING.standard.md,
                      marginBottom: SPACING.standard.md,
                      backgroundColor: '#f5f5f5',
                      borderRadius: 4
                    }}
                  >
                    <p style={{ fontSize: TEXT_SIZES.body, fontWeight: 'bold', margin: 0 }}>
                      Step {idx + 1}: {step.stepTitle}
                    </p>
                    <p style={{ fontSize: TEXT_SIZES.body, margin: 0, marginTop: 4 }}>
                      {step.stepPrompt}
                    </p>
                    <p style={{ fontSize: TEXT_SIZES.small, opacity: 0.7, margin: 0, marginTop: 4 }}>
                      Expected: {step.expectedArtifact}
                    </p>
                  </div>
                ))}
              </div>
            </UiCard>
          )}

          {/* Summary */}
          {data.summary && data.summary.length > 0 && (
            <UiCard>
              <h2 style={{ fontSize: TEXT_SIZES.subheading, marginBottom: SPACING.standard.md }}>
                Process summary
              </h2>
              <div>
                {data.summary.map((item, idx) => (
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

          {/* Next steps */}
          <NextStepsCard
            sessionId={sessionId}
            learnerId={learnerId}
            role="teacher"
          />
        </>
      )}

      {/* Trust message */}
      {!data && !loading && (
        <div style={{ marginTop: SPACING.large, padding: SPACING.standard.md, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
          <p style={{ fontSize: TEXT_SIZES.small, margin: 0, opacity: 0.7 }}>
            <strong>Trust:</strong> This doesn&apos;t grade learners. No labels, no diagnosis. You&apos;re here to support, not judge.
          </p>
        </div>
      )}
    </div>
  );
}

