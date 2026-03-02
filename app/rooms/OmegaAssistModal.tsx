'use client';

import { useState } from 'react';
import { RoomKey } from '@/app/state/types';
import { roomConfig } from './roomConfig';

interface OmegaAssistModalProps {
  sourceContent: string;
  onAddToRoom: (room: RoomKey, text: string) => void;
  onClose: () => void;
}

// Simulated Omega RC analysis - in real implementation, this would call an API
function analyzeWithOmegaRC(sourceContent: string): {
  assumptions: string[];
  evidenceGaps: string[];
  causal: string[];
  constraints: string[];
  tradeoffs: string[];
} {
  // This is a placeholder - in production, this would call /api/llm/explain with omegaMode
  // For now, return structured suggestions based on simple heuristics
  const assumptions = [
    'The source assumes certain conditions are true.',
    'There may be unstated premises underlying the claim.',
  ];
  const evidenceGaps = [
    'Direct evidence for this claim is not provided.',
    'Consider what observable data would support or contradict this.',
  ];
  const causal = [
    'Consider what factors might lead to this outcome.',
    'What dependencies exist between elements mentioned?',
  ];
  const constraints = [
    'What limits or boundaries apply here?',
    'What failure modes should be considered?',
  ];
  const tradeoffs = [
    'What alternatives exist to this approach?',
    'What are the costs of different options?',
  ];

  return {
    assumptions,
    evidenceGaps,
    causal,
    constraints,
    tradeoffs,
  };
}

export function OmegaAssistModal({ sourceContent, onAddToRoom, onClose }: OmegaAssistModalProps) {
  const [analysis, setAnalysis] = useState<ReturnType<typeof analyzeWithOmegaRC> | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!sourceContent.trim()) {
      return;
    }
    setLoading(true);
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const result = analyzeWithOmegaRC(sourceContent);
    setAnalysis(result);
    setLoading(false);
  };

  if (!analysis && !loading) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem',
        }}
        onClick={onClose}
      >
        <div
          className="site-card-lg"
          style={{
            maxWidth: '600px',
            width: '100%',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e5e5',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '1rem',
              color: '#171717',
            }}
          >
            Analyze with Omega RC
          </h2>
          <p
            style={{
              fontSize: '0.875rem',
              color: '#525252',
              marginBottom: '1.5rem',
              lineHeight: '1.6',
            }}
          >
            Omega RC will suggest items for each room. You choose what to add.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={onClose} className="site-btn site-btn-secondary">
              Cancel
            </button>
            <button onClick={handleAnalyze} className="site-btn site-btn-primary" disabled={!sourceContent.trim()}>
              Analyze
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}
        onClick={onClose}
      >
        <div
          className="site-card-lg"
          style={{
            maxWidth: '600px',
            width: '100%',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e5e5',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <p style={{ textAlign: 'center', color: '#525252' }}>Analyzing...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem',
        overflow: 'auto',
      }}
      onClick={onClose}
    >
      <div
        className="site-card-lg"
        style={{
          maxWidth: '700px',
          width: '100%',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e5e5',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#171717',
            }}
          >
            Omega RC Analysis
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#737373',
              padding: '0.25rem 0.5rem',
            }}
          >
            ×
          </button>
        </div>

        <p
          style={{
            fontSize: '0.875rem',
            color: '#525252',
            marginBottom: '2rem',
            fontStyle: 'italic',
          }}
        >
          Review suggestions below. Click "Add" to import into a room.
        </p>

        {/* Assumptions */}
        {analysis && analysis.assumptions && analysis.assumptions.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
                color: '#171717',
              }}
            >
              Assumptions
            </h3>
            {analysis.assumptions.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: '#fafafa',
                  borderRadius: '0.5rem',
                }}
              >
                <p style={{ flex: 1, fontSize: '0.875rem', color: '#404040', margin: 0 }}>{item}</p>
                <button
                  onClick={() => {
                    onAddToRoom('assumptions', item);
                  }}
                  className="site-btn site-btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', whiteSpace: 'nowrap' }}
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Evidence Gaps */}
        {analysis && analysis.evidenceGaps && analysis.evidenceGaps.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
                color: '#171717',
              }}
            >
              Evidence Gaps
            </h3>
            {analysis.evidenceGaps.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: '#fafafa',
                  borderRadius: '0.5rem',
                }}
              >
                <p style={{ flex: 1, fontSize: '0.875rem', color: '#404040', margin: 0 }}>{item}</p>
                <button
                  onClick={() => {
                    onAddToRoom('evidence', item);
                  }}
                  className="site-btn site-btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', whiteSpace: 'nowrap' }}
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Causal */}
        {analysis && analysis.causal && analysis.causal.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
                color: '#171717',
              }}
            >
              Causal Relationships
            </h3>
            {analysis.causal.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: '#fafafa',
                  borderRadius: '0.5rem',
                }}
              >
                <p style={{ flex: 1, fontSize: '0.875rem', color: '#404040', margin: 0 }}>{item}</p>
                <button
                  onClick={() => {
                    onAddToRoom('causal', item);
                  }}
                  className="site-btn site-btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', whiteSpace: 'nowrap' }}
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Constraints */}
        {analysis && analysis.constraints && analysis.constraints.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
                color: '#171717',
              }}
            >
              Constraints
            </h3>
            {analysis.constraints.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: '#fafafa',
                  borderRadius: '0.5rem',
                }}
              >
                <p style={{ flex: 1, fontSize: '0.875rem', color: '#404040', margin: 0 }}>{item}</p>
                <button
                  onClick={() => {
                    onAddToRoom('constraints', item);
                  }}
                  className="site-btn site-btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', whiteSpace: 'nowrap' }}
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tradeoffs */}
        {analysis && analysis.tradeoffs && analysis.tradeoffs.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
                color: '#171717',
              }}
            >
              Tradeoffs
            </h3>
            {analysis.tradeoffs.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: '#fafafa',
                  borderRadius: '0.5rem',
                }}
              >
                <p style={{ flex: 1, fontSize: '0.875rem', color: '#404040', margin: 0 }}>{item}</p>
                <button
                  onClick={() => {
                    onAddToRoom('tradeoffs', item);
                  }}
                  className="site-btn site-btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', whiteSpace: 'nowrap' }}
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e5e5' }}>
          <button onClick={onClose} className="site-btn site-btn-primary" style={{ width: '100%' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

