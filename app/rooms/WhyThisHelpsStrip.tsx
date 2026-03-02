'use client';

export function WhyThisHelpsStrip() {
  return (
    <div
      style={{
        padding: '0.75rem 1.5rem',
        backgroundColor: '#fafafa',
        borderBottom: '1px solid #e5e5e5',
        fontSize: '0.875rem',
        color: '#404040',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span>
          <strong>This space helps you slow down and examine claims without arguing or deciding.</strong>
        </span>
        <span style={{ fontSize: '0.75rem', color: '#737373', fontStyle: 'italic' }}>
          No verdicts · No persuasion · You stay in control
        </span>
      </div>
    </div>
  );
}





























