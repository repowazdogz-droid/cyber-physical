/**
 * Share Link Card
 * 
 * Displays share link with short code, full URL, expiry, copy button.
 * ND-first: clear, calm, bounded text.
 * 
 * Version: 1.0.0
 */

import React, { useState } from 'react';
import { SPACING, TEXT_SIZES } from '../../../ui/uiTokens';
import { UiCard } from '@/app/ui';

const spacing = SPACING.standard;
const textSizes = TEXT_SIZES.standard;

interface ShareLinkCardProps {
  token: string;
  shareUrl: string;
  expiresAtIso: string;
  shortCode?: string;
}

export default function ShareLinkCard({ token, shareUrl, expiresAtIso, shortCode }: ShareLinkCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatExpiry = (expiresAtIso: string): string => {
    const expires = new Date(expiresAtIso);
    return expires.toLocaleString();
  };

  return (
    <UiCard style={{ marginBottom: spacing.md }}>
      <div style={{ padding: spacing.md }}>
        <p style={{ fontSize: textSizes.body, fontWeight: 'bold', margin: '0 0 ' + spacing.sm + ' 0' }}>
          Share Link
        </p>

        {/* Short code */}
        {shortCode && (
          <p style={{ fontSize: textSizes.small, margin: '0 0 ' + spacing.xs + ' 0', opacity: 0.7 }}>
            Code: <code style={{ backgroundColor: '#f5f5f5', padding: '2px 4px', borderRadius: 2 }}>{shortCode}</code>
          </p>
        )}

        {/* Full URL */}
        <div style={{
          padding: spacing.sm,
          backgroundColor: '#f5f5f5',
          borderRadius: 4,
          marginBottom: spacing.sm,
          wordBreak: 'break-all'
        }}>
          <p style={{ fontSize: textSizes.small, margin: 0, fontFamily: 'monospace' }}>
            {shareUrl}
          </p>
        </div>

        {/* Expiry */}
        <p style={{ fontSize: textSizes.small, margin: '0 0 ' + spacing.sm + ' 0', opacity: 0.7 }}>
          Expires at: {formatExpiry(expiresAtIso)}
        </p>

        {/* ND-first note */}
        <p style={{ fontSize: textSizes.small, margin: '0 0 ' + spacing.sm + ' 0', opacity: 0.6 }}>
          This shows process, not grades. You can revoke anytime.
        </p>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          style={{
            padding: spacing.sm,
            fontSize: textSizes.body,
            backgroundColor: copied ? '#4caf50' : '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            width: '100%'
          }}
        >
          {copied ? '✓ Copied!' : 'Copy Link'}
        </button>
      </div>
    </UiCard>
  );
}




