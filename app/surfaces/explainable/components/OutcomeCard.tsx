/**
 * Outcome Card Component
 * 
 * Big outcome label + 1-line subtitle (calm).
 * Optional confidence chip.
 * 
 * Version: 1.0.0
 */

import React from 'react';
import { ExplainableOutcomeCardModel } from '../ExplainableTypes';
import { SPACING, TEXT_SIZES } from '../../../learning/ui/uiTokens';

const spacing = SPACING.standard;
const textSizes = TEXT_SIZES.standard;

interface OutcomeCardProps {
  model: ExplainableOutcomeCardModel;
  calmMode?: boolean;
}

export default function OutcomeCard({ model, calmMode = true }: OutcomeCardProps) {
  return (
    <div style={{
      padding: spacing.lg,
      backgroundColor: calmMode ? '#e3f2fd' : '#f5f5f5',
      borderRadius: 4,
      marginBottom: spacing.md
    }}>
      <p style={{
        fontSize: textSizes.h1,
        margin: 0,
        fontWeight: 'bold',
        color: calmMode ? '#1976d2' : '#000'
      }}>
        {model.label}
      </p>
      <p style={{
        fontSize: textSizes.body,
        margin: spacing.sm + ' 0 0 0',
        opacity: 0.8
      }}>
        {model.subtitle}
      </p>
      {model.confidence && (
        <span style={{
          display: 'inline-block',
          marginTop: spacing.sm,
          padding: `${spacing.xs} ${spacing.sm}`,
          fontSize: textSizes.small,
          backgroundColor: '#f5f5f5',
          border: '1px solid #ccc',
          borderRadius: 4
        }}>
          Confidence: {model.confidence}
        </span>
      )}
      {model.terminalNodeId && (
        <p style={{
          fontSize: textSizes.small,
          margin: spacing.xs + ' 0 0 0',
          opacity: 0.6
        }}>
          Terminal node: {model.terminalNodeId}
        </p>
      )}
    </div>
  );
}








































