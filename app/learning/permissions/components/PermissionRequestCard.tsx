/**
 * Permission Request Card
 * 
 * Teacher/parent enters learnerId + sessionId.
 * "Request access" → creates token request.
 * ND-first: one primary action at a time.
 * 
 * Version: 1.0.0
 */

import React, { useState } from 'react';
import { SPACING, TEXT_SIZES } from '../../../ui/uiTokens';
import { UiCard } from '@/app/ui';
import { ShareScope } from '../../../../spine/share/ShareTypes';

const spacing = SPACING.standard;
const textSizes = TEXT_SIZES.standard;

interface PermissionRequestCardProps {
  scope: ShareScope;
  scopeLabel: string;
  onRequest: (learnerId: string, sessionId?: string) => Promise<void>;
}

export default function PermissionRequestCard({ scope, scopeLabel, onRequest }: PermissionRequestCardProps) {
  const [learnerId, setLearnerId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = async () => {
    if (!learnerId.trim()) {
      setError('Learner ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onRequest(learnerId.trim(), sessionId.trim() || undefined);
      setLearnerId('');
      setSessionId('');
    } catch (err: any) {
      setError(err.message || 'Failed to request access');
    } finally {
      setLoading(false);
    }
  };

  return (
    <UiCard style={{ marginBottom: spacing.md }}>
      <div style={{ padding: spacing.md }}>
        <p style={{ fontSize: textSizes.body, fontWeight: 'bold', margin: '0 0 ' + spacing.sm + ' 0' }}>
          Request {scopeLabel}
        </p>

        {/* Learner ID */}
        <div style={{ marginBottom: spacing.sm }}>
          <label style={{ display: 'block', fontSize: textSizes.small, marginBottom: spacing.xs }}>
            Learner ID *
          </label>
          <input
            type="text"
            value={learnerId}
            onChange={(e) => setLearnerId(e.target.value)}
            placeholder="learner-123"
            style={{
              width: '100%',
              padding: spacing.sm,
              fontSize: textSizes.body,
              border: '1px solid #ccc',
              borderRadius: 4
            }}
          />
        </div>

        {/* Session ID (optional) */}
        <div style={{ marginBottom: spacing.sm }}>
          <label style={{ display: 'block', fontSize: textSizes.small, marginBottom: spacing.xs }}>
            Session ID (optional)
          </label>
          <input
            type="text"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="session-456"
            style={{
              width: '100%',
              padding: spacing.sm,
              fontSize: textSizes.body,
              border: '1px solid #ccc',
              borderRadius: 4
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: spacing.sm,
            backgroundColor: '#ffebee',
            borderRadius: 4,
            marginBottom: spacing.sm
          }}>
            <p style={{ fontSize: textSizes.small, color: '#d32f2f', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Request button */}
        <button
          onClick={handleRequest}
          disabled={loading || !learnerId.trim()}
          style={{
            width: '100%',
            padding: spacing.sm,
            fontSize: textSizes.body,
            backgroundColor: loading || !learnerId.trim() ? '#ccc' : '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: loading || !learnerId.trim() ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Requesting...' : 'Request Access'}
        </button>
      </div>
    </UiCard>
  );
}




