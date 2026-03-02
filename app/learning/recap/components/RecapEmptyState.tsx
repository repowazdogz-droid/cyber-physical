'use client';

import React from 'react';
import { SPACING, MAX_LINE_WIDTH, TEXT_SIZES, TAP_MIN_PX } from '../../ui/uiTokens';
import UiCard from '../../ui/UiCard';
import PrimaryActionBar from '../../ui/PrimaryActionBar';

interface RecapEmptyStateProps {
  errorType?: 'not_found' | 'not_imported' | 'load_failed' | 'partial';
  sessionId?: string;
  onRetry?: () => void;
  onCreateNew?: () => void;
}

export default function RecapEmptyState({
  errorType = 'not_found',
  sessionId,
  onRetry,
  onCreateNew
}: RecapEmptyStateProps) {
  const getMessage = () => {
    switch (errorType) {
      case 'not_found':
        return "This recap isn't available yet.";
      case 'not_imported':
        return "This session hasn't been imported.";
      case 'load_failed':
        return "Couldn't load the recap.";
      case 'partial':
        return "This recap is incomplete.";
      default:
        return "This recap isn't available.";
    }
  };

  const getHint = () => {
    switch (errorType) {
      case 'not_found':
        return "The session might not be exported yet, or the link is incorrect.";
      case 'not_imported':
        return "Export the session from Vision Pro first.";
      case 'load_failed':
        return "Check your connection and try again.";
      case 'partial':
        return "Some data might be missing, but you can still view what's available.";
      default:
        return "";
    }
  };

  return (
    <div style={{ padding: SPACING.standard.md, maxWidth: MAX_LINE_WIDTH, margin: '0 auto' }}>
      <UiCard>
        <h2 style={{ fontSize: TEXT_SIZES.subheading, marginBottom: SPACING.standard.md }}>
          {getMessage()}
        </h2>

        <p style={{ fontSize: TEXT_SIZES.body, opacity: 0.7, marginBottom: SPACING.large }}>
          {getHint()}
        </p>

        {sessionId && (
          <p style={{ fontSize: TEXT_SIZES.small, opacity: 0.5, marginBottom: SPACING.standard.md }}>
            Session: {sessionId}
          </p>
        )}

        <PrimaryActionBar
          primaryLabel={onRetry ? "Try again" : "Go back"}
          onPrimary={onRetry || (() => window.history.back())}
          secondaryLabel={onCreateNew ? "Start new session" : undefined}
          onSecondary={onCreateNew}
          readingMode="standard"
          calmMode={true}
        />

        <div style={{ marginTop: SPACING.large, padding: SPACING.standard.md, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
          <p style={{ fontSize: TEXT_SIZES.small, margin: 0, opacity: 0.7 }}>
            <strong>Remember:</strong> This doesn&apos;t grade you. You can stop anytime.
          </p>
        </div>
      </UiCard>
    </div>
  );
}


