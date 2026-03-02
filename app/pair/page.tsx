'use client';

import React, { useState, useEffect } from 'react';
import { SPACING, MAX_LINE_WIDTH, TEXT_SIZES, TAP_MIN_PX } from '../learning/ui/uiTokens';
import UiCard from '../learning/ui/UiCard';
import PrimaryActionBar from '../learning/ui/PrimaryActionBar';

interface PairingResponse {
  pairCode: string;
  expiresAtIso: string;
  bootstrap: {
    sessionId: string;
    learnerId: string;
    thoughtObjectsUrl: string;
    recapBaseUrl: string;
    mode: string;
    reduceMotion: boolean;
  };
  pairUrl: string;
}

export default function PairPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pairing, setPairing] = useState<PairingResponse | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const handleCreatePair = async (mode: 'demo' | 'solo' | 'presence' = 'demo', reduceMotion: boolean = true) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/learning/pair/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          reduceMotion,
          ageBand: '10-12',
          missionId: 'understand',
          topicId: 'math-basics'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create pairing');
      }

      const data: PairingResponse = await response.json();
      setPairing(data);

      // Generate QR code with canonical format: https://host/pair?code=K7D4P9
      const canonicalUrl = `${window.location.origin}/pair?code=${data.pairCode}`;
      generateQRCode(canonicalUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to create pairing');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (text: string) => {
    // Try to use qrcode library if available
    try {
      // Dynamic import of qrcode (if installed)
      const QRCode = await import('qrcode');
      const dataUrl = await QRCode.toDataURL(text, {
        width: 300,
        margin: 2
      });
      setQrDataUrl(dataUrl);
    } catch {
      // Fallback: show URL as text
      setQrDataUrl(null);
    }
  };

  const handleCopyLink = () => {
    if (pairing) {
      const url = pairing.pairUrl || `/api/learning/pair/${pairing.pairCode}`;
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const handleCopyCode = () => {
    if (pairing) {
      navigator.clipboard.writeText(pairing.pairCode);
      alert('Code copied to clipboard!');
    }
  };

  return (
    <div style={{ padding: SPACING.standard.md, maxWidth: MAX_LINE_WIDTH, margin: '0 auto' }}>
      <h1 style={{ fontSize: TEXT_SIZES.heading, marginBottom: SPACING.large }}>
        Pair with Vision Pro
      </h1>

      <p style={{ fontSize: TEXT_SIZES.body, marginBottom: SPACING.large, opacity: 0.7 }}>
        Create a pairing code to connect your Vision Pro session
      </p>

      {/* Error */}
      {error && (
        <UiCard style={{ marginBottom: SPACING.large, backgroundColor: '#ffebee' }}>
          <p style={{ color: '#d32f2f', fontSize: TEXT_SIZES.body }}>{error}</p>
        </UiCard>
      )}

      {/* Main actions */}
      {!pairing ? (
        <>
          <UiCard style={{ marginBottom: SPACING.large }}>
            <PrimaryActionBar
              primaryLabel="Create Pair QR (Demo)"
              onPrimary={() => handleCreatePair('demo', true)}
              secondaryLabel="Create Pair QR (Solo)"
              onSecondary={() => handleCreatePair('solo', false)}
              readingMode="standard"
              calmMode={false}
            />
          </UiCard>

          {/* UAV Demo Pair Button */}
          <UiCard style={{ marginBottom: SPACING.large }}>
            <button
              onClick={async () => {
                setLoading(true);
                setError(null);
                try {
                  const response = await fetch('/api/learning/pair/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      mode: 'demo',
                      reduceMotion: true,
                      learnerId: 'demo-uav',
                      sessionId: `uav-demo-${Date.now().toString().slice(-8)}`,
                      thoughtObjectsUrl: `${window.location.origin}/api/learning/thoughtObjects?learnerId=demo-uav`
                    })
                  });

                  if (!response.ok) {
                    throw new Error('Failed to create UAV demo pairing');
                  }

                  const data: PairingResponse = await response.json();
                  setPairing(data);
                  const canonicalUrl = `${window.location.origin}/pair?code=${data.pairCode}`;
                  generateQRCode(canonicalUrl);
                } catch (err: any) {
                  setError(err.message || 'Failed to create pairing');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              style={{
                width: '100%',
                padding: SPACING.standard.md,
                fontSize: TEXT_SIZES.body,
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: loading ? 'not-allowed' : 'pointer',
                minHeight: TAP_MIN_PX
              }}
            >
              UAV Demo Pair
            </button>
            <p style={{ fontSize: TEXT_SIZES.small, marginTop: SPACING.small, opacity: 0.7 }}>
              Quick pair for UAV kernel demo (demo-uav learner, reduce motion ON)
            </p>
          </UiCard>

          {/* Other options */}
          <UiCard style={{ marginBottom: SPACING.large }}>
            <button
              onClick={() => handleCreatePair('presence', true)}
              disabled={loading}
              style={{
                padding: SPACING.standard.md,
                fontSize: TEXT_SIZES.body,
                backgroundColor: '#f5f5f5',
                border: '1px solid #ccc',
                borderRadius: 4,
                cursor: loading ? 'not-allowed' : 'pointer',
                minHeight: TAP_MIN_PX,
                width: '100%'
              }}
            >
              Create Pair QR (Presence)
            </button>
          </UiCard>
        </>
      ) : (
        <UiCard style={{ marginBottom: SPACING.large }}>
          <h2 style={{ fontSize: TEXT_SIZES.subheading, marginBottom: SPACING.standard.md }}>
            Pairing Code
          </h2>

          {/* QR Code */}
          {qrDataUrl ? (
            <div style={{ textAlign: 'center', marginBottom: SPACING.standard.md }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt="QR Code"
                style={{
                  width: 300,
                  height: 300,
                  border: '1px solid #ccc',
                  borderRadius: 4
                }}
              />
            </div>
          ) : (
            <div style={{
              padding: SPACING.large,
              backgroundColor: '#f5f5f5',
              borderRadius: 4,
              textAlign: 'center',
              marginBottom: SPACING.standard.md
            }}>
              <p style={{ fontSize: TEXT_SIZES.small, opacity: 0.7 }}>
                QR library not available. Use code below.
              </p>
            </div>
          )}

          {/* Pair Code (Large Text) */}
          <div style={{
            padding: SPACING.large,
            backgroundColor: '#e3f2fd',
            borderRadius: 4,
            textAlign: 'center',
            marginBottom: SPACING.standard.md
          }}>
            <p style={{ fontSize: TEXT_SIZES.small, opacity: 0.7, marginBottom: SPACING.small }}>
              Enter this code in Vision Pro:
            </p>
            <p style={{
              fontSize: 48,
              fontWeight: 'bold',
              letterSpacing: '0.2em',
              fontFamily: 'monospace',
              margin: 0
            }}>
              {pairing.pairCode}
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: SPACING.small }}>
            <button
              onClick={handleCopyCode}
              style={{
                flex: 1,
                padding: SPACING.standard.md,
                fontSize: TEXT_SIZES.body,
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                minHeight: TAP_MIN_PX
              }}
            >
              Copy Code
            </button>
            <button
              onClick={handleCopyLink}
              style={{
                flex: 1,
                padding: SPACING.standard.md,
                fontSize: TEXT_SIZES.body,
                backgroundColor: '#f5f5f5',
                border: '1px solid #ccc',
                borderRadius: 4,
                cursor: 'pointer',
                minHeight: TAP_MIN_PX
              }}
            >
              Copy Link
            </button>
          </div>

          {/* Info */}
          <div style={{ marginTop: SPACING.standard.md, padding: SPACING.small, opacity: 0.7 }}>
            <p style={{ fontSize: TEXT_SIZES.small, margin: 0 }}>
              Expires: {new Date(pairing.expiresAtIso).toLocaleString()}
            </p>
            <p style={{ fontSize: TEXT_SIZES.small, margin: 0, marginTop: 4 }}>
              Session: {pairing.bootstrap.sessionId}
            </p>
          </div>
        </UiCard>
      )}

      {/* Info */}
      <div style={{ marginTop: SPACING.large, padding: SPACING.standard.md, opacity: 0.7 }}>
        <p style={{ fontSize: TEXT_SIZES.small }}>
          Scan the QR code or enter the 6-character code in Vision Pro to pair your session.
        </p>
      </div>
    </div>
  );
}

