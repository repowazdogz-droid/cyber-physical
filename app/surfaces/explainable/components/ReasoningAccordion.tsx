/**
 * Reasoning Accordion Component
 * 
 * Collapsible section with max 12 reasoning items.
 * Each item: short title + one sentence.
 * 
 * Version: 1.0.0
 */

import React, { useState } from 'react';
import { ExplainableReasoningItemModel } from '../ExplainableTypes';
import { SPACING, TEXT_SIZES } from '../../../learning/ui/uiTokens';

const spacing = SPACING.standard;
const textSizes = TEXT_SIZES.standard;

interface ReasoningAccordionProps {
  items: ExplainableReasoningItemModel[];
  calmMode?: boolean;
}

export default function ReasoningAccordion({ items, calmMode = true }: ReasoningAccordionProps) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) {
    return null;
  }

  const displayItems = items.slice(0, 12); // Max 12

  return (
    <div style={{ marginBottom: spacing.lg }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          padding: spacing.md,
          fontSize: textSizes.body,
          backgroundColor: 'transparent',
          border: '1px solid #ccc',
          borderRadius: 4,
          cursor: 'pointer',
          textAlign: 'left'
        }}
      >
        {expanded ? '▼' : '▶'} Reasoning Highlights ({displayItems.length})
      </button>
      {expanded && (
        <div style={{ marginTop: spacing.md }}>
          {displayItems.map((item) => (
            <div
              key={item.id}
              style={{
                padding: spacing.sm,
                marginBottom: spacing.sm,
                backgroundColor: '#f9f9f9',
                borderRadius: 4,
                borderLeft: `3px solid ${
                  item.type === 'override' ? '#d32f2f' :
                  item.type === 'disallow' ? '#ff9800' :
                  item.type === 'decision' ? '#4caf50' :
                  '#2196f3'
                }`
              }}
            >
              <p style={{ fontSize: textSizes.body, fontWeight: 'bold', margin: '0 0 ' + spacing.xs + ' 0' }}>
                {item.title}
              </p>
              <p style={{ fontSize: textSizes.small, margin: 0, opacity: 0.7 }}>
                {item.sentence}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}








































