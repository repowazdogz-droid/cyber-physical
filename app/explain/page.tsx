'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WorkspaceItem } from '@/app/state/types';

export default function ExplainPage() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const exampleChips = [
    { label: 'Public claim', text: 'AI will replace half of all jobs in 5 years' },
    { label: 'Product promise', text: 'Our new app will make you 10x more productive with zero learning curve' },
    { label: 'Policy statement', text: 'This new regulation will reduce emissions by 50% while maintaining economic growth' },
  ];

  const handleExampleClick = (text: string) => {
    setInputValue(text);
    setFetchError('');
  };

  const isUrl = (text: string) => {
    if (!text || typeof text !== 'string') return false;
    try {
      const trimmed = text.trim();
      // Quick check: must start with http:// or https://
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        return false;
      }
      // Validate it's a proper URL
      const u = new URL(trimmed);
      return ['http:', 'https:'].includes(u.protocol);
    } catch {
      return false;
    }
  };

  const formatCharCount = (count: number) => {
    return count.toLocaleString();
  };
  
  const MAX_INPUT_LENGTH = 8000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setIsLoading(true);
    setStatusMessage('');
    setFetchError('');
    setSubmitError(null);

    let contentToAnalyze = inputValue.trim();

    // Hard reject URLs - prevent API call
    const urlDetected = isUrl(contentToAnalyze);
    if (urlDetected) {
      setFetchError('URLs are not supported yet. Please paste the headline or short text instead.');
      setIsLoading(false);
      return;
    }

    // Hard reject content exceeding limit
    if (contentToAnalyze.length > MAX_INPUT_LENGTH) {
      setFetchError('Text is too long for Omega RC. Please paste a single headline or short claim.');
      setIsLoading(false);
      return;
    }

    setStatusMessage('Drafting structure...');

    try {
      // Call Omega RC scaffold API
      const response = await fetch('/api/explain/scaffold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceContent: contentToAnalyze }),
      });
      
      const data = await response.json().catch(() => ({}));
      
      if (!response.ok || data?.ok === false) {
        setSubmitError(data?.error || `Request failed (${response.status}). Check server logs.`);
        setIsLoading(false);
        return;
      }

      // Handle validation errors from server (should be rare since we validate client-side)
      if (data.validationError === 'url_not_supported') {
        setFetchError('URLs are not supported yet. Please paste the headline or short text instead.');
        setIsLoading(false);
        return;
      }
      if (data.validationError === 'too_long') {
        setFetchError(data.fallbackMessage || 'Text is too long for Omega RC. Please paste a single headline or short claim.');
        setIsLoading(false);
        return;
      }

      // Handle response - API always returns ok: true with scaffold (or fallback)
      let scaffold;
      if (!data.ok || !data.scaffold) {
        scaffold = {
          summary: 'This appears to be a claim or framing that needs clarification.',
          assumptions: ['The claim assumes missing context.'],
          evidence: [],
          constraints: ['What evidence supports this is not shown.'],
          tradeoffs: ['The claim could be interpreted differently depending on context.'],
          whatWouldChangeAnalysis: [],
        };
        setFetchError('Draft created with minimal structure. You can edit freely.');
      } else {
        scaffold = data.scaffold;
        
        // If fallback was used, show a calm message
        if (data.fallback) {
          setFetchError('Draft created with minimal structure. You can edit freely.');
        }
        
        // Ensure scaffold has content, otherwise use minimal fallback
        const hasContent = 
          (scaffold.summary && scaffold.summary.trim().length > 0) ||
          (scaffold.assumptions && scaffold.assumptions.length > 0) ||
          (scaffold.evidence && scaffold.evidence.length > 0) ||
          (scaffold.constraints && scaffold.constraints.length > 0) ||
          (scaffold.tradeoffs && scaffold.tradeoffs.length > 0) ||
          (scaffold.whatWouldChangeAnalysis && scaffold.whatWouldChangeAnalysis.length > 0);
        
        if (!hasContent) {
          scaffold = {
            summary: scaffold.summary || 'This appears to be a claim or framing that needs clarification.',
            assumptions: scaffold.assumptions && scaffold.assumptions.length > 0 
              ? scaffold.assumptions 
              : ['The claim assumes missing context.'],
            evidence: scaffold.evidence && scaffold.evidence.length > 0
              ? scaffold.evidence
              : [],
            constraints: scaffold.constraints && scaffold.constraints.length > 0
              ? scaffold.constraints
              : ['What evidence supports this is not shown.'],
            tradeoffs: scaffold.tradeoffs && scaffold.tradeoffs.length > 0
              ? scaffold.tradeoffs
              : ['The claim could be interpreted differently depending on context.'],
            whatWouldChangeAnalysis: scaffold.whatWouldChangeAnalysis || [],
          };
          setFetchError('Draft created with minimal structure. You can edit freely.');
        }
      }

      // Create workspace with scaffolded content
      // Helper to split multiline strings into separate items
      function splitMultilineText(text: string): string[] {
        return text
          .split(/\r?\n+/)
          .map((line) => line.replace(/^\s*[-•]\s+/, '').trim())
          .filter((line) => line.length > 0);
      }

      // Helper to convert array to WorkspaceItem[] with proper filtering and multiline splitting
      const toItems = (arr: unknown): WorkspaceItem[] => {
        if (!Array.isArray(arr)) return [];
        const items: WorkspaceItem[] = [];
        let idx = 0;
        for (const raw of arr) {
          if (typeof raw !== 'string' || !raw.trim()) continue;
          // Split multiline strings into separate items
          const lines = splitMultilineText(raw.trim());
          for (const line of lines) {
            items.push({
              id: `scaffold-${Date.now()}-${idx++}`,
              text: line,
              createdAt: Date.now(),
            });
          }
        }
        return items;
      };

      const workspaceId = crypto.randomUUID();
      const workspace = {
        id: workspaceId,
        summary: scaffold.summary || '',
        source: {
          type: 'text' as const,
          content: inputValue.trim(), // Store original input
        },
        // Map scaffold.summary to claim (single item)
        claim: typeof scaffold?.summary === 'string' && scaffold.summary.trim()
          ? [{ id: `scaffold-claim-${Date.now()}`, text: scaffold.summary.trim(), createdAt: Date.now() }]
          : [],
        assumptions: toItems(scaffold?.assumptions),
        evidence: toItems(scaffold?.evidence),
        // Map scaffold.constraints to both missing (UI) and constraints (internal)
        missing: toItems(scaffold?.constraints),
        constraints: toItems(scaffold?.constraints),
        // Map scaffold.tradeoffs to both framings (UI) and tradeoffs (internal)
        framings: toItems(scaffold?.tradeoffs),
        tradeoffs: toItems(scaffold?.tradeoffs),
        causal: [],
        whatWouldChangeAnalysis: toItems(scaffold?.whatWouldChangeAnalysis),
        createdAt: Date.now(),
      };

      // Store in localStorage
      localStorage.setItem(`workspace_${workspaceId}`, JSON.stringify(workspace));

      // Navigate to explanation view
      router.push(`/explain/${workspaceId}`);
    } catch (error) {
      setStatusMessage('');
      setFetchError('Draft created with minimal structure. You can edit freely.');
      
      // Fallback: create minimal draft workspace
      const workspaceId = crypto.randomUUID();
      const workspace = {
        id: workspaceId,
        summary: 'Draft unavailable — here is a basic structure to edit.',
        source: {
          type: 'text' as const,
          content: inputValue.trim(),
        },
        assumptions: [
          {
            id: 'fallback-1',
            text: 'This assumes the source is representative.',
            createdAt: Date.now(),
          },
          {
            id: 'fallback-2',
            text: 'This assumes key context is not missing.',
            createdAt: Date.now(),
          },
        ],
        evidence: [
          {
            id: 'fallback-evidence-1',
            text: '(No extracted evidence yet — add what is directly shown or quoted.)',
            createdAt: Date.now(),
          },
        ],
        causal: [],
        constraints: [
          {
            id: 'fallback-constraint-1',
            text: '(Context missing — add what would change your interpretation.)',
            createdAt: Date.now(),
          },
        ],
        tradeoffs: [
          {
            id: 'fallback-tradeoff-1',
            text: '(Add other reasonable interpretations.)',
            createdAt: Date.now(),
          },
        ],
      };
      localStorage.setItem(`workspace_${workspaceId}`, JSON.stringify(workspace));
      router.push(`/explain/${workspaceId}`);
    } finally {
      setIsLoading(false);
    }
  };

  const charCount = inputValue.length;

  return (
    <div className="site-container">
      <div className="site-main">
        <div className="site-content" style={{ maxWidth: '700px', margin: '0 auto', paddingTop: '2rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
          <h1
            className="site-h1"
            style={{
              textAlign: 'center',
              marginBottom: '0.5rem',
              fontSize: '2.5rem',
            }}
          >
            Omega RC
          </h1>
          <p
            className="site-text-lg"
            style={{
              textAlign: 'center',
              marginBottom: '0.5rem',
              color: '#525252',
              fontSize: '1.125rem',
            }}
          >
            Claim inspection for headlines and short text.
          </p>
          <p
            style={{
              textAlign: 'center',
              marginBottom: '1rem',
              fontSize: '0.875rem',
              color: '#737373',
            }}
          >
            Paste a claim. Omega will separate what's asserted, assumed, shown, and missing — without conclusions.
          </p>
          <p
            style={{
              textAlign: 'center',
              marginBottom: '2rem',
              fontSize: '0.75rem',
              color: '#a3a3a3',
            }}
          >
            Best for headlines and short claims. URLs not supported.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <textarea
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setFetchError('');
                }}
                placeholder="Paste a headline or short claim…"
                maxLength={MAX_INPUT_LENGTH}
                style={{
                  width: '100%',
                  minHeight: '200px',
                  padding: '1.5rem',
                  border: '1px solid #d4d4d4',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                  marginBottom: '0.5rem',
                  lineHeight: '1.6',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#171717';
                  e.target.style.boxShadow = '0 0 0 3px rgba(23, 23, 23, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d4d4d4';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {exampleChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleExampleClick(chip.text)}
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.375rem 0.75rem',
                      border: '1px solid #d4d4d4',
                      borderRadius: '0.375rem',
                      background: '#ffffff',
                      color: '#404040',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#171717';
                      e.currentTarget.style.backgroundColor = '#fafafa';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#d4d4d4';
                      e.currentTarget.style.backgroundColor = '#ffffff';
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              {charCount > 2000 && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: '#737373',
                      fontStyle: 'italic',
                      margin: 0,
                    }}
                  >
                    Long inputs can reduce clarity. Omega RC works best on a single claim.
                  </p>
                </div>
              )}
            </div>

            {submitError && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fca5a5',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#991b1b',
                }}
              >
                {submitError}
              </div>
            )}
            {fetchError && (
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fbbf24',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem',
                  fontSize: '0.875rem',
                  color: '#92400e',
                }}
              >
                {fetchError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <button
                type="submit"
                className="site-btn site-btn-primary"
                style={{
                  fontSize: '1rem',
                  padding: '0.75rem 2rem',
                  minWidth: '200px',
                }}
                disabled={!inputValue.trim() || isLoading}
              >
                {isLoading ? 'Analyzing...' : 'Inspect claim'}
              </button>
              
              {statusMessage && (
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: '#525252',
                    fontStyle: 'italic',
                    margin: 0,
                  }}
                >
                  {statusMessage}
                </p>
              )}
              
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
