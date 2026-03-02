'use client';

import { useState } from 'react';
import { roomConfig } from '../../roomConfig';
import { useWorkspace } from '@/app/state/WorkspaceContext';

export default function CausalPage() {
  const config = roomConfig.causal;
  const { workspace, addItem } = useWorkspace();
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      addItem('causal', inputValue);
      setInputValue('');
    }
  };

  if (!workspace) {
    return <div>Loading...</div>;
  }

  const items = workspace.causal;

  return (
    <div>
      <h1 className="site-h2">{config.label}</h1>
      <p className="site-text-base" style={{ marginBottom: '0.5rem', color: '#525252' }}>
        {config.description}
      </p>
      <p className="site-text-sm" style={{ marginBottom: '1.5rem', color: '#737373', fontStyle: 'italic' }}>
        {config.rule}
      </p>
      <div
        className="site-card"
        style={{
          minHeight: '200px',
          marginBottom: '1.5rem',
          backgroundColor: '#fafafa',
          borderLeft: `4px solid ${config.accentColor}`,
          borderTop: '1px solid #e5e5e5',
          borderRight: '1px solid #e5e5e5',
          borderBottom: '1px solid #e5e5e5',
        }}
      >
        {items.length === 0 ? (
          <p className="site-text-sm" style={{ color: '#737373' }}>
            Causal relationships will appear here
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {items.map((item) => (
              <li
                key={item.id}
                style={{
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e5e5',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  color: '#171717',
                }}
              >
                {item.text}
              </li>
            ))}
          </ul>
        )}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={config.placeholder}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: `1px solid ${config.accentColor}`,
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = config.accentColor;
            e.target.style.boxShadow = `0 0 0 3px ${config.accentColor}20`;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = config.accentColor;
            e.target.style.boxShadow = 'none';
          }}
        />
      </form>
    </div>
  );
}

