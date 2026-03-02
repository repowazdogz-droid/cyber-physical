'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Workspace } from '@/app/state/types';

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    const loadWorkspace = async () => {
      try {
        const response = await fetch(`/api/share/workspace?token=${token}`);
        const data = await response.json();
        if (data.ok && data.workspace) {
          setWorkspace(data.workspace);
        } else {
          setError(data.error || 'Share not found');
        }
      } catch (err) {
        setError('Failed to load share');
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkspace();
  }, [token]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="site-container">
        <div className="site-main">
          <div className="site-content" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '4rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1rem', color: '#525252' }}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="site-container">
        <div className="site-main">
          <div className="site-content" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '4rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1rem', color: '#525252', marginBottom: '1rem' }}>
              {error || 'Share not found'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const sourceText = workspace.source?.content || '';

  return (
    <div className="site-container">
      <div className="site-main">
        <div className="site-content" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <h1
                  className="site-h1"
                  style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    marginBottom: '0.5rem',
                    color: '#171717',
                  }}
                >
                  Omega RC Analysis
                </h1>
                <p style={{ fontSize: '0.875rem', color: '#737373' }}>
                  Read-only view
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleCopyLink}
                className="site-btn site-btn-secondary"
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                Copy link
              </button>
            </div>
          </div>

          {/* Source */}
          <section style={{ marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '1px solid #e5e5e5' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#171717', marginBottom: '0.5rem' }}>
              Source
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#404040', lineHeight: '1.6', padding: '0.75rem', backgroundColor: '#fafafa', borderRadius: '0.5rem', border: '1px solid #e5e5e5' }}>
              {sourceText || 'No source text'}
            </p>
          </section>

          {/* What it claims */}
          <section style={{ marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '1px solid #e5e5e5' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#171717', marginBottom: '0.5rem' }}>
              What it claims
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#404040', lineHeight: '1.6', padding: '0.75rem', backgroundColor: '#fafafa', borderRadius: '0.5rem', border: '1px solid #e5e5e5' }}>
              {workspace.summary || 'No claim summary'}
            </p>
          </section>

          {/* What's actually shown */}
          <section style={{ marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '1px solid #e5e5e5' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#171717', marginBottom: '0.5rem' }}>
              What's actually shown
            </h2>
            {workspace.evidence && workspace.evidence.length > 0 ? (
              <div>
                {workspace.evidence.map((item) => (
                  <p key={item.id} style={{ fontSize: '0.875rem', color: '#404040', lineHeight: '1.6', marginBottom: '0.5rem', padding: '0.75rem', backgroundColor: '#fafafa', borderRadius: '0.5rem', border: '1px solid #e5e5e5' }}>
                    • {item.text}
                  </p>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.875rem', color: '#a3a3a3', fontStyle: 'italic' }}>
                Nothing drafted here yet.
              </p>
            )}
          </section>

          {/* What it assumes */}
          <section style={{ marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '1px solid #e5e5e5' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#171717', marginBottom: '0.5rem' }}>
              What it assumes
            </h2>
            {workspace.assumptions && workspace.assumptions.length > 0 ? (
              <div>
                {workspace.assumptions.map((item) => (
                  <p key={item.id} style={{ fontSize: '0.875rem', color: '#404040', lineHeight: '1.6', marginBottom: '0.5rem', padding: '0.75rem', backgroundColor: '#fafafa', borderRadius: '0.5rem', border: '1px solid #e5e5e5' }}>
                    • {item.text}
                  </p>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.875rem', color: '#a3a3a3', fontStyle: 'italic' }}>
                Nothing drafted here yet.
              </p>
            )}
          </section>

          {/* What's missing / unclear */}
          <section style={{ marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '1px solid #e5e5e5' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#171717', marginBottom: '0.5rem' }}>
              What's missing / unclear
            </h2>
            {workspace.constraints && workspace.constraints.length > 0 ? (
              <div>
                {workspace.constraints.map((item) => (
                  <p key={item.id} style={{ fontSize: '0.875rem', color: '#404040', lineHeight: '1.6', marginBottom: '0.5rem', padding: '0.75rem', backgroundColor: '#fafafa', borderRadius: '0.5rem', border: '1px solid #e5e5e5' }}>
                    • {item.text}
                  </p>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.875rem', color: '#a3a3a3', fontStyle: 'italic' }}>
                Nothing drafted here yet.
              </p>
            )}
          </section>

          {/* Other framings */}
          <section style={{ marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '1px solid #e5e5e5' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#171717', marginBottom: '0.5rem' }}>
              Other framings
            </h2>
            {workspace.tradeoffs && workspace.tradeoffs.length > 0 ? (
              <div>
                {workspace.tradeoffs.map((item) => (
                  <p key={item.id} style={{ fontSize: '0.875rem', color: '#404040', lineHeight: '1.6', marginBottom: '0.5rem', padding: '0.75rem', backgroundColor: '#fafafa', borderRadius: '0.5rem', border: '1px solid #e5e5e5' }}>
                    • {item.text}
                  </p>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.875rem', color: '#a3a3a3', fontStyle: 'italic' }}>
                Nothing drafted here yet.
              </p>
            )}
          </section>

          {/* What would materially change this analysis */}
          <section style={{ marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '1px solid #e5e5e5' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#171717', marginBottom: '0.5rem' }}>
              What would materially change this analysis
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#737373', marginBottom: '1rem', fontStyle: 'italic' }}>
              This section lists types of information that would affect interpretation. It does not recommend actions or next steps.
            </p>
            {workspace.whatWouldChangeAnalysis && workspace.whatWouldChangeAnalysis.length > 0 ? (
              <div>
                {workspace.whatWouldChangeAnalysis.map((item) => (
                  <p key={item.id} style={{ fontSize: '0.875rem', color: '#404040', lineHeight: '1.6', marginBottom: '0.5rem', padding: '0.75rem', backgroundColor: '#fafafa', borderRadius: '0.5rem', border: '1px solid #e5e5e5' }}>
                    • {item.text}
                  </p>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.875rem', color: '#a3a3a3', fontStyle: 'italic' }}>
                Nothing drafted here yet.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}




























