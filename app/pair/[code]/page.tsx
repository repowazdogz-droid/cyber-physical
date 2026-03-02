'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SPACING, MAX_LINE_WIDTH, TEXT_SIZES } from '../../learning/ui/uiTokens';
import UiCard from '../../learning/ui/UiCard';

export default function PairCodePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pairing, setPairing] = useState<any>(null);

  const code = params?.code as string;

  useEffect(() => {
    if (!code) {
      setError('No pair code provided');
      setLoading(false);
      return;
    }

    // Fetch pairing info
    async function fetchPairing() {
      try {
        const response = await fetch(`/api/learning/pair/${code}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Pair code not found');
          } else if (response.status === 410) {
            setError('Pair code expired');
          } else {
            setError('Failed to fetch pairing');
          }
          return;
        }

        const data = await response.json();
        setPairing(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch pairing');
      } finally {
        setLoading(false);
      }
    }

    fetchPairing();
  }, [code]);

  if (loading) {
    return (
      <div style={{ padding: SPACING.standard.md, maxWidth: MAX_LINE_WIDTH, margin: '0 auto' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: SPACING.standard.md, maxWidth: MAX_LINE_WIDTH, margin: '0 auto' }}>
        <UiCard style={{ backgroundColor: '#ffebee' }}>
          <p style={{ color: '#d32f2f', fontSize: TEXT_SIZES.body }}>{error}</p>
          <button
            onClick={() => router.push('/pair')}
            style={{
              marginTop: SPACING.standard.md,
              padding: SPACING.standard.md,
              fontSize: TEXT_SIZES.body,
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Create New Pair Code
          </button>
        </UiCard>
      </div>
    );
  }

  return (
    <div style={{ padding: SPACING.standard.md, maxWidth: MAX_LINE_WIDTH, margin: '0 auto' }}>
      <h1 style={{ fontSize: TEXT_SIZES.heading, marginBottom: SPACING.large }}>
        Pairing Code: {code}
      </h1>

      {pairing && (
        <UiCard>
          <p style={{ fontSize: TEXT_SIZES.body, marginBottom: SPACING.standard.md }}>
            <strong>Session ID:</strong> {pairing.bootstrap?.sessionId}
          </p>
          <p style={{ fontSize: TEXT_SIZES.body, marginBottom: SPACING.standard.md }}>
            <strong>Expires:</strong> {new Date(pairing.expiresAtIso).toLocaleString()}
          </p>
          <p style={{ fontSize: TEXT_SIZES.small, opacity: 0.7, marginTop: SPACING.standard.md }}>
            Scan this code in Vision Pro to pair your session.
          </p>
        </UiCard>
      )}
    </div>
  );
}








































