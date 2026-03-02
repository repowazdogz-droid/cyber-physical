/**
 * Talk Track Component
 * 
 * Collapsible "60-second talk track".
 * Renders max 6 bullets.
 * Audience aware: demo vs learner vs teacher tone (still calm).
 * 
 * Version: 1.0.0
 */

import React, { useState } from 'react';
import { ExplainableTalkTrackModel } from '../ExplainableTypes';
import { SPACING, TEXT_SIZES } from '../../../learning/ui/uiTokens';

const spacing = SPACING.standard;
const textSizes = TEXT_SIZES.standard;

interface TalkTrackProps {
  model: ExplainableTalkTrackModel;
  calmMode?: boolean;
}

export default function TalkTrack({ model, calmMode = true }: TalkTrackProps) {
  const [expanded, setExpanded] = useState(false);

  if (!model || model.bullets.length === 0) {
    return null;
  }

  const displayBullets = model.bullets.slice(0, 6); // Max 6

  // Audience-aware title
  const title = model.audience === 'demo' 
    ? '60-Second Demo Script'
    : model.audience === 'teacher'
    ? 'Teaching Notes'
    : 'Summary';

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
        {expanded ? '▼' : '▶'} {title}
      </button>
      {expanded && (
        <div style={{
          marginTop: spacing.md,
          padding: spacing.md,
          backgroundColor: '#fff3e0',
          borderRadius: 4
        }}>
          {displayBullets.map((bullet, idx) => (
            <p key={idx} style={{ fontSize: textSizes.body, margin: '0 0 ' + spacing.sm + ' 0' }}>
              • {bullet}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}








































