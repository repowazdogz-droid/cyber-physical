'use client';

import { useState, useEffect } from 'react';
import { Container } from '../../(site)/components/Container';
import { Section } from '../../(site)/components/Section';
import UiCard from '../../ui/UiCard';
const Card = UiCard;
import { OmegaMetaBadge } from '../../components/omega/OmegaMetaBadge';
import type { OmegaMeta } from '@/spine/llm/modes/OmegaMeta';

interface InquiryManifest {
  artifactId: string;
  kind: string;
  contractVersion: string;
  createdAtIso: string;
  files: Array<{ name: string; sha256: string; bytes: number }>;
  rootSha256: string;
  redactionsApplied: string[];
  omega?: OmegaMeta;
  meta?: {
    omega?: OmegaMeta;
  };
}

interface InquiryPayload {
  inquiry: {
    name?: string;
    email?: string;
    org?: string;
    domainTags?: string[];
    message: string;
    preferredFollowup?: string;
    consentToStore: boolean;
    createdAtIso: string;
  };
}

export default function AdminInquiriesPage() {
  const [manifests, setManifests] = useState<InquiryManifest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [payloads, setPayloads] = useState<Record<string, InquiryPayload>>({});

  useEffect(() => {
    // Guard: only in non-production
    if (process.env.NODE_ENV === 'production') {
      setError('This page is only available in development mode.');
      setLoading(false);
      return;
    }

    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      const response = await fetch('/api/artifacts/list?kind=CONTACT_INQUIRY&limit=20');
      if (!response.ok) {
        throw new Error('Failed to fetch inquiries');
      }
      const data = await response.json();
      setManifests(data.manifests || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayload = async (artifactId: string) => {
    if (payloads[artifactId]) return;

    try {
      const response = await fetch(`/api/artifacts/${artifactId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch artifact');
      }
      const data = await response.json();
      setPayloads({ ...payloads, [artifactId]: data.payloads });
    } catch (err: any) {
      console.error('Failed to fetch payload:', err);
    }
  };

  const toggleExpand = (artifactId: string) => {
    if (expandedId === artifactId) {
      setExpandedId(null);
    } else {
      setExpandedId(artifactId);
      fetchPayload(artifactId);
    }
  };

  if (process.env.NODE_ENV === 'production') {
    return (
      <Section>
        <Container>
          <Card>
            <p>This page is only available in development mode.</p>
          </Card>
        </Container>
      </Section>
    );
  }

  if (loading) {
    return (
      <Section>
        <Container>
          <Card>
            <p>Loading inquiries...</p>
          </Card>
        </Container>
      </Section>
    );
  }

  if (error) {
    return (
      <Section>
        <Container>
          <Card>
            <p style={{ color: '#d32f2f' }}>{error}</p>
          </Card>
        </Container>
      </Section>
    );
  }

  return (
    <>
      <Section>
        <Container>
          <h1 className="site-heading-1">Contact Inquiries</h1>
          <p className="site-body">
            Admin view of contact form submissions (development only).
          </p>
        </Container>
      </Section>

      <Section>
        <Container>
          <div style={{ display: 'grid', gap: '16px' }}>
            {manifests.length === 0 ? (
              <Card>
                <p>No inquiries found.</p>
              </Card>
            ) : (
              manifests.map((manifest) => {
                const payload = payloads[manifest.artifactId];
                const inquiry = payload?.inquiry;
                const isExpanded = expandedId === manifest.artifactId;

                return (
                  <Card key={manifest.artifactId} variant="elevated">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          <span style={{ fontSize: '13px', color: '#6a6a6a' }}>
                            {new Date(manifest.createdAtIso).toLocaleString()}
                          </span>
                          {inquiry?.name && (
                            <span style={{ fontSize: '13px', fontWeight: 500 }}>
                              {inquiry.name}
                            </span>
                          )}
                          {inquiry?.email && (
                            <span style={{ fontSize: '13px', color: '#6a6a6a' }}>
                              {inquiry.email}
                            </span>
                          )}
                        </div>
                        {inquiry?.org && (
                          <div style={{ fontSize: '13px', color: '#6a6a6a', marginBottom: '4px' }}>
                            {inquiry.org}
                          </div>
                        )}
                        <OmegaMetaBadge omega={manifest.omega ?? manifest.meta?.omega} />
                        {inquiry?.domainTags && inquiry.domainTags.length > 0 && (
                          <div style={{ marginTop: '4px' }}>
                            {inquiry.domainTags.map((tag, i) => (
                              <span
                                key={i}
                                style={{
                                  display: 'inline-block',
                                  fontSize: '11px',
                                  padding: '2px 8px',
                                  background: '#f5f5f5',
                                  borderRadius: '4px',
                                  marginRight: '4px'
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {!isExpanded && inquiry?.message && (
                          <p style={{ 
                            fontSize: '14px', 
                            color: '#4a4a4a', 
                            marginTop: '8px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            {inquiry.message}
                          </p>
                        )}
                        {isExpanded && inquiry && (
                          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e5e5' }}>
                            <p style={{ fontSize: '14px', color: '#4a4a4a', whiteSpace: 'pre-wrap' }}>
                              {inquiry.message}
                            </p>
                            {inquiry.preferredFollowup && (
                              <p style={{ fontSize: '13px', color: '#6a6a6a', marginTop: '12px' }}>
                                Preferred follow-up: {inquiry.preferredFollowup}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => toggleExpand(manifest.artifactId)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '13px',
                          border: '1px solid #e5e5e5',
                          borderRadius: '4px',
                          background: 'white',
                          cursor: 'pointer'
                        }}
                      >
                        {isExpanded ? 'Collapse' : 'Expand'}
                      </button>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#9a9a9a', fontFamily: 'monospace' }}>
                      {manifest.artifactId}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </Container>
      </Section>
    </>
  );
}

