'use client';

import { useState } from 'react';
import DemoOutput from './DemoOutput';

const MAX_INPUT_LENGTH = 500;

export default function DemoSandbox() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<{
    claims: string[];
    evidence: string[];
    unknowns: string[];
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enforce character limit
    if (input.length > MAX_INPUT_LENGTH) {
      alert(`Input must be ${MAX_INPUT_LENGTH} characters or less.`);
      return;
    }

    // TODO: This would call a bounded API endpoint
    // For now, this is a placeholder that enforces structure only
    // Output must be Claims, Evidence, Unknowns only
    setOutput({
      claims: [],
      evidence: [],
      unknowns: []
    });
  };

  return (
    <div className="card">
      <h3 className="h2" style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--s-3)' }}>Optional sandbox (strictly bounded)</h3>
      <form onSubmit={handleSubmit}>
        <textarea
          value={input}
          onChange={(e) => {
            const text = e.target.value;
            if (text.length <= MAX_INPUT_LENGTH) {
              setInput(text);
            }
          }}
          placeholder="Enter text (max 500 characters, text only)"
          rows={6}
          maxLength={MAX_INPUT_LENGTH}
          style={{
            width: '100%',
            padding: 'var(--s-3)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-1)',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-md)',
            lineHeight: 'var(--lh-normal)',
            resize: 'vertical'
          }}
        />
        <div style={{ marginTop: 'var(--s-2)' }}>
          <span className="note">{input.length} / {MAX_INPUT_LENGTH} characters</span>
        </div>
        <button type="submit" disabled={input.length === 0} className="btn btn-primary" style={{ marginTop: 'var(--s-3)' }}>
          Analyze
        </button>
      </form>
      
      {output && (
        <div style={{ marginTop: 'var(--s-5)' }}>
          <p className="p-muted">Pre-verified demonstration of Omega&apos;s reasoning constraints.</p>
          <DemoOutput output={output} />
        </div>
      )}
      
      <p className="note" style={{ marginTop: 'var(--s-4)' }}>This demonstration shows structure, not intelligence.</p>
    </div>
  );
}

