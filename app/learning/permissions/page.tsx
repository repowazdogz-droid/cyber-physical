/**
 * Permissions Page
 * 
 * Unified permissions page with tabs for:
 * - Teacher access
 * - Share recap
 * - Share kernel/orchestrator runs
 * - XR pairing
 * 
 * Version: 1.0.0
 */

'use client';

import React, { useState, useEffect } from 'react';
import { SPACING, TEXT_SIZES } from '../../ui/uiTokens';
import { UiCard } from '@/app/ui';
import ConsentCard from './components/ConsentCard';
import ShareLinkCard from './components/ShareLinkCard';
import PermissionRequestCard from './components/PermissionRequestCard';
import { ShareTokenRecord, ShareScope } from '../../../spine/share/ShareTypes';

const spacing = SPACING.standard;
const textSizes = TEXT_SIZES.standard;

type Tab = 'teacher' | 'recap' | 'runs' | 'pairing';

export default function PermissionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('teacher');
  const [tokens, setTokens] = useState<ShareTokenRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    // In a real implementation, this would fetch from API
    // For now, we'll use localStorage or API
    try {
      const response = await fetch('/api/share/list');
      if (response.ok) {
        const data = await response.json();
        setTokens(data.tokens || []);
      }
    } catch (err) {
      // Ignore for now
    }
  };

  const handleRequest = async (scope: ShareScope, learnerId: string, sessionId?: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/share/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope,
          learnerId,
          sessionId,
          ttlMinutes: 60
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create token');
      }

      const data = await response.json();
      await loadTokens(); // Reload tokens
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (token: string) => {
    try {
      const response = await fetch('/api/share/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      if (response.ok) {
        await loadTokens(); // Reload tokens
      }
    } catch (err) {
      // Ignore for now
    }
  };

  const handleCopyLink = (shareUrl: string) => {
    navigator.clipboard.writeText(shareUrl);
  };

  const getTokensForScope = (scope: ShareScope): ShareTokenRecord[] => {
    return tokens.filter(t => t.scope === scope);
  };

  const getShareUrl = (token: ShareTokenRecord): string => {
    const baseUrl = window.location.origin;
    switch (token.scope) {
      case ShareScope.TEACHER_RECAP:
        return `${baseUrl}/teacher/recap?token=${token.token}&learnerId=${token.learnerId}${token.sessionId ? `&sessionId=${token.sessionId}` : ''}`;
      case ShareScope.SESSION_RECAP:
        return `${baseUrl}/learning/recap/${token.sessionId}?token=${token.token}`;
      case ShareScope.KERNEL_RUNS:
      case ShareScope.ORCHESTRATOR_RUNS:
        return `${baseUrl}/learning/permissions?token=${token.token}&scope=${token.scope}`;
      case ShareScope.PAIRING_BOOTSTRAP:
        return `${baseUrl}/api/learning/pair/${token.token}`;
      default:
        return '';
    }
  };

  return (
    <div style={{ padding: spacing.md, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: textSizes.h1, marginBottom: spacing.md }}>
        Permissions & Sharing
      </h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.lg, flexWrap: 'wrap' }}>
        {(['teacher', 'recap', 'runs', 'pairing'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: spacing.sm,
              fontSize: textSizes.body,
              backgroundColor: activeTab === tab ? '#1976d2' : '#f5f5f5',
              color: activeTab === tab ? 'white' : 'black',
              border: '1px solid #ccc',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            {tab === 'teacher' ? 'Teacher Access' :
             tab === 'recap' ? 'Share Recap' :
             tab === 'runs' ? 'Share Runs' :
             'XR Pairing'}
          </button>
        ))}
      </div>

      {/* Teacher Access Tab */}
      {activeTab === 'teacher' && (
        <>
          <PermissionRequestCard
            scope={ShareScope.TEACHER_RECAP}
            scopeLabel="Teacher Access"
            onRequest={(learnerId, sessionId) => handleRequest(ShareScope.TEACHER_RECAP, learnerId, sessionId)}
          />
          {getTokensForScope(ShareScope.TEACHER_RECAP).map(token => (
            <ConsentCard
              key={token.tokenId}
              token={token}
              shareUrl={getShareUrl(token)}
              onRevoke={() => handleRevoke(token.token)}
              onCopyLink={() => handleCopyLink(getShareUrl(token))}
            />
          ))}
        </>
      )}

      {/* Share Recap Tab */}
      {activeTab === 'recap' && (
        <>
          <PermissionRequestCard
            scope={ShareScope.SESSION_RECAP}
            scopeLabel="Session Recap"
            onRequest={(learnerId, sessionId) => handleRequest(ShareScope.SESSION_RECAP, learnerId, sessionId)}
          />
          {getTokensForScope(ShareScope.SESSION_RECAP).map(token => (
            <ShareLinkCard
              key={token.tokenId}
              token={token.token}
              shareUrl={getShareUrl(token)}
              expiresAtIso={token.expiresAtIso}
            />
          ))}
        </>
      )}

      {/* Share Runs Tab */}
      {activeTab === 'runs' && (
        <>
          <PermissionRequestCard
            scope={ShareScope.KERNEL_RUNS}
            scopeLabel="Kernel Runs"
            onRequest={(learnerId) => handleRequest(ShareScope.KERNEL_RUNS, learnerId)}
          />
          {getTokensForScope(ShareScope.KERNEL_RUNS).map(token => (
            <ConsentCard
              key={token.tokenId}
              token={token}
              shareUrl={getShareUrl(token)}
              onRevoke={() => handleRevoke(token.token)}
              onCopyLink={() => handleCopyLink(getShareUrl(token))}
            />
          ))}
        </>
      )}

      {/* XR Pairing Tab */}
      {activeTab === 'pairing' && (
        <>
          <PermissionRequestCard
            scope={ShareScope.PAIRING_BOOTSTRAP}
            scopeLabel="XR Pairing"
            onRequest={(learnerId, sessionId) => handleRequest(ShareScope.PAIRING_BOOTSTRAP, learnerId, sessionId)}
          />
          {getTokensForScope(ShareScope.PAIRING_BOOTSTRAP).map(token => (
            <ShareLinkCard
              key={token.tokenId}
              token={token.token}
              shareUrl={getShareUrl(token)}
              expiresAtIso={token.expiresAtIso}
            />
          ))}
        </>
      )}
    </div>
  );
}
