'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Workspace } from '@/app/state/types';

const STORAGE_PREFIX = 'workspace_';

function loadWorkspace(workspaceId: string): Workspace | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${workspaceId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load workspace:', error);
  }
  return null;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ExportPage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    if (workspaceId) {
      const loaded = loadWorkspace(workspaceId);
      setWorkspace(loaded);
    }
  }, [workspaceId]);

  if (!workspace) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading workspace...</p>
      </div>
    );
  }

  const generatedDate = formatDate(new Date());

  return (
    <>
      <style jsx>{`
        .export-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow-y: auto;
          background: white;
          z-index: 1000;
        }
        @media print {
          .no-print {
            display: none !important;
          }
          .export-wrapper {
            position: static;
          }
          body {
            background: white;
          }
          .export-container {
            max-width: 100%;
            padding: 0;
          }
        }
        @page {
          margin: 1in;
        }
      `}</style>
      <div className="export-wrapper">
        <div
          className="export-container"
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '3rem 2rem',
            backgroundColor: '#ffffff',
            color: '#171717',
          }}
        >
        {/* Header */}
        <header style={{ marginBottom: '3rem', borderBottom: '2px solid #171717', paddingBottom: '1.5rem' }}>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              marginBottom: '0.5rem',
              color: '#171717',
            }}
          >
            {workspaceId}
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#525252', marginBottom: '0.25rem' }}>
            Epistemic workspace — read-only
          </p>
          <p style={{ fontSize: '0.75rem', color: '#737373' }}>
            Generated {generatedDate}
          </p>
        </header>

        {/* Summary */}
        {workspace.summary && workspace.summary.trim() && (
          <section style={{ marginBottom: '3rem', pageBreakInside: 'avoid' }}>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                marginBottom: '1rem',
                color: '#171717',
              }}
            >
              What this is saying
            </h2>
            <div
              style={{
                padding: '1.5rem',
                backgroundColor: '#fafafa',
                border: '1px solid #d4d4d4',
                borderRadius: '0.5rem',
                minHeight: '80px',
              }}
            >
              <p style={{ fontSize: '1rem', lineHeight: '1.75', color: '#171717', whiteSpace: 'pre-wrap' }}>
                {workspace.summary}
              </p>
            </div>
          </section>
        )}

        {/* Source */}
        <section style={{ marginBottom: '3rem', pageBreakInside: 'avoid' }}>
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '1rem',
              color: '#171717',
            }}
          >
            What is being examined
          </h2>
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: '#fafafa',
              border: '1px solid #d4d4d4',
              borderRadius: '0.5rem',
              minHeight: '80px',
            }}
          >
            {workspace.source.content.trim() ? (
              <p style={{ fontSize: '1rem', lineHeight: '1.75', color: '#171717', whiteSpace: 'pre-wrap' }}>
                {workspace.source.content}
              </p>
            ) : (
              <p style={{ fontSize: '0.875rem', color: '#737373', fontStyle: 'italic' }}>
                (No source provided)
              </p>
            )}
          </div>
        </section>

        {/* Assumptions */}
        <section style={{ marginBottom: '3rem', pageBreakInside: 'avoid' }}>
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '1rem',
              color: '#171717',
            }}
          >
            Assumptions
          </h2>
          {workspace.assumptions.length > 0 ? (
            <ol
              style={{
                listStyle: 'decimal',
                paddingLeft: '1.5rem',
                margin: 0,
              }}
            >
              {workspace.assumptions.map((item) => (
                <li
                  key={item.id}
                  style={{
                    fontSize: '1rem',
                    lineHeight: '1.75',
                    color: '#171717',
                    marginBottom: '0.75rem',
                  }}
                >
                  {item.text}
                </li>
              ))}
            </ol>
          ) : (
            <p style={{ fontSize: '0.875rem', color: '#737373', fontStyle: 'italic' }}>
              No assumptions recorded
            </p>
          )}
        </section>

        {/* Evidence */}
        <section style={{ marginBottom: '3rem', pageBreakInside: 'avoid' }}>
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '1rem',
              color: '#171717',
            }}
          >
            Evidence
          </h2>
          {workspace.evidence.length > 0 ? (
            <ul
              style={{
                listStyle: 'disc',
                paddingLeft: '1.5rem',
                margin: 0,
              }}
            >
              {workspace.evidence.map((item) => (
                <li
                  key={item.id}
                  style={{
                    fontSize: '1rem',
                    lineHeight: '1.75',
                    color: '#171717',
                    marginBottom: '0.75rem',
                  }}
                >
                  {item.text}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: '0.875rem', color: '#737373', fontStyle: 'italic' }}>
              No evidence recorded
            </p>
          )}
        </section>

        {/* Causal Relationships */}
        <section style={{ marginBottom: '3rem', pageBreakInside: 'avoid' }}>
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '1rem',
              color: '#171717',
            }}
          >
            Causal Relationships
          </h2>
          {workspace.causal.length > 0 ? (
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
              }}
            >
              {workspace.causal.map((item) => (
                <li
                  key={item.id}
                  style={{
                    fontSize: '1rem',
                    lineHeight: '1.75',
                    color: '#171717',
                    marginBottom: '0.75rem',
                    paddingLeft: '1.5rem',
                    position: 'relative',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      color: '#737373',
                    }}
                  >
                    →
                  </span>
                  {item.text}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: '0.875rem', color: '#737373', fontStyle: 'italic' }}>
              No causal relationships recorded
            </p>
          )}
        </section>

        {/* Constraints */}
        <section style={{ marginBottom: '3rem', pageBreakInside: 'avoid' }}>
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '1rem',
              color: '#171717',
            }}
          >
            Constraints
          </h2>
          {workspace.constraints.length > 0 ? (
            <ul
              style={{
                listStyle: 'disc',
                paddingLeft: '1.5rem',
                margin: 0,
              }}
            >
              {workspace.constraints.map((item) => (
                <li
                  key={item.id}
                  style={{
                    fontSize: '1rem',
                    lineHeight: '1.75',
                    color: '#171717',
                    marginBottom: '0.75rem',
                  }}
                >
                  {item.text}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: '0.875rem', color: '#737373', fontStyle: 'italic' }}>
              No constraints recorded
            </p>
          )}
        </section>

        {/* Tradeoffs */}
        <section style={{ marginBottom: '3rem', pageBreakInside: 'avoid' }}>
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '1rem',
              color: '#171717',
            }}
          >
            Other reasonable interpretations
          </h2>
          {workspace.tradeoffs.length > 0 ? (
            <div>
              {workspace.tradeoffs.map((item, index) => (
                <div key={item.id}>
                  <p
                    style={{
                      fontSize: '1rem',
                      lineHeight: '1.75',
                      color: '#171717',
                      marginBottom: '0.75rem',
                    }}
                  >
                    {item.text}
                  </p>
                  {index < workspace.tradeoffs.length - 1 && (
                    <div
                      style={{
                        borderTop: '1px solid #d4d4d4',
                        margin: '1rem 0',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.875rem', color: '#737373', fontStyle: 'italic' }}>
              No alternatives recorded
            </p>
          )}
        </section>

        {/* Footer */}
        <footer
          style={{
            marginTop: '4rem',
            paddingTop: '2rem',
            borderTop: '1px solid #d4d4d4',
            fontSize: '0.75rem',
            color: '#737373',
            textAlign: 'center',
          }}
        >
          Generated with Omega RC — human-led epistemic analysis
        </footer>
        </div>
      </div>
    </>
  );
}

