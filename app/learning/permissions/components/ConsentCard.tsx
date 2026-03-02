/**
 * Consent Card
 * 
 * Calm card showing consent status, who, what, expiry.
 * Buttons: Approve / Revoke / Copy link.
 * ND-first: zero dense text.
 * 
 * Version: 1.0.0
 */

import React from 'react';
import { SPACING, TEXT_SIZES } from '../../../ui/uiTokens';
import { UiCard } from '@/app/ui';
import { ShareTokenRecord, ShareScope } from '../../../../spine/share/ShareTypes';

const spacing = SPACING.standard;
const textSizes = TEXT_SIZES.standard;

interface ConsentCardProps {
  token: ShareTokenRecord;
  shareUrl?: string;
  onRevoke?: () => void;
  onCopyLink?: () => void;
}

export default function ConsentCard({ token, shareUrl, onRevoke, onCopyLink }: ConsentCardProps) {
  const isExpired = new Date(token.expiresAtIso) < new Date();
  const isRevoked = !!token.revokedAtIso;

  const getScopeLabel = (scope: ShareScope): string => {
    switch (scope) {
      case ShareScope.TEACHER_RECAP: return 'Teacher Recap';
      case ShareScope.SESSION_RECAP: return 'Session Recap';
      case ShareScope.KERNEL_RUNS: return 'Kernel Runs';
      case ShareScope.ORCHESTRATOR_RUNS: return 'Orchestrator Runs';
      case ShareScope.PAIRING_BOOTSTRAP: return 'XR Pairing';
      default: return scope;
    }
  };

  const formatExpiry = (expiresAtIso: string): string => {
    const expires = new Date(expiresAtIso);
    const now = new Date();
    const diffMs = expires.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffMs < 0) return 'Expired';
    if (diffHours > 0) return `Expires in ${diffHours}h ${diffMinutes}m`;
    return `Expires in ${diffMinutes}m`;
  };

  return (
    <UiCard style={{ marginBottom: spacing.md }}>
      <div style={{ padding: spacing.md }}>
        {/* Status */}
        <div style={{ marginBottom: spacing.sm }}>
          <span style={{
            fontSize: textSizes.small,
            padding: `${spacing.xs} ${spacing.sm}`,
            backgroundColor: isRevoked ? '#ffebee' : isExpired ? '#fff3e0' : '#e8f5e9',
            borderRadius: 4,
            display: 'inline-block'
          }}>
            {isRevoked ? 'Revoked' : isExpired ? 'Expired' : 'Active'}
          </span>
        </div>

        {/* What */}
        <p style={{ fontSize: textSizes.body, fontWeight: 'bold', margin: '0 0 ' + spacing.xs + ' 0' }}>
          {getScopeLabel(token.scope)}
        </p>

        {/* Who */}
        <p style={{ fontSize: textSizes.small, margin: '0 0 ' + spacing.xs + ' 0', opacity: 0.7 }}>
          Learner: {token.learnerId.substring(0, 20)}...
        </p>

        {/* Session */}
        {token.sessionId && (
          <p style={{ fontSize: textSizes.small, margin: '0 0 ' + spacing.xs + ' 0', opacity: 0.7 }}>
            Session: {token.sessionId.substring(0, 20)}...
          </p>
        )}

        {/* Expiry */}
        <p style={{ fontSize: textSizes.small, margin: '0 0 ' + spacing.sm + ' 0', opacity: 0.7 }}>
          {formatExpiry(token.expiresAtIso)}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
          {shareUrl && onCopyLink && !isRevoked && !isExpired && (
            <button
              onClick={onCopyLink}
              style={{
                padding: spacing.sm,
                fontSize: textSizes.small,
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Copy Link
            </button>
          )}
          {onRevoke && !isRevoked && !isExpired && (
            <button
              onClick={onRevoke}
              style={{
                padding: spacing.sm,
                fontSize: textSizes.small,
                backgroundColor: '#f5f5f5',
                border: '1px solid #ccc',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Revoke
            </button>
          )}
        </div>
      </div>
    </UiCard>
  );
}




