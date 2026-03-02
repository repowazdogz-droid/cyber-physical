/**
 * Policy Notes Component
 * 
 * Renders max 3 short lines, collapsible if >1.
 * 
 * Version: 1.0.0
 */

import React, { useState } from 'react';
import { ExplainablePolicyNoteModel } from '../ExplainableTypes';
import { SPACING, TEXT_SIZES } from '../../../learning/ui/uiTokens';

const spacing = SPACING.standard;
const textSizes = TEXT_SIZES.standard;

interface PolicyNotesProps {
  notes: ExplainablePolicyNoteModel[];
  calmMode?: boolean;
}

export default function PolicyNotes({ notes, calmMode = true }: PolicyNotesProps) {
  const [expanded, setExpanded] = useState(false);

  if (notes.length === 0) {
    return null;
  }

  // Always show if only 1 note, collapsible if >1
  const shouldCollapse = notes.length > 1;
  const displayNotes = shouldCollapse && !expanded ? notes.slice(0, 1) : notes;

  return (
    <div style={{
      marginTop: spacing.md,
      padding: spacing.md,
      backgroundColor: '#fff3e0',
      borderRadius: 4
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
        <h3 style={{ fontSize: textSizes.body, fontWeight: 'bold', margin: 0 }}>
          Policy Notes
        </h3>
        {shouldCollapse && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              padding: spacing.xs,
              fontSize: textSizes.small,
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#1976d2'
            }}
          >
            {expanded ? '▼' : '▶'}
          </button>
        )}
      </div>
      {displayNotes.map((note) => (
        <p key={note.id} style={{ fontSize: textSizes.small, margin: '0 0 ' + spacing.xs + ' 0' }}>
          • {note.text}
        </p>
      ))}
    </div>
  );
}








































