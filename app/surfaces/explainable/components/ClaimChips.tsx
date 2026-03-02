/**
 * Claim Chips Component
 * 
 * Renders claim chips (max 8).
 * Severity styling (calm, no aggressive colors).
 * 
 * Version: 1.0.0
 */

import React from 'react';
import { ExplainableClaimChipModel } from '../ExplainableTypes';
import { SPACING, TEXT_SIZES } from '../../../learning/ui/uiTokens';

const spacing = SPACING.standard;
const textSizes = TEXT_SIZES.standard;

interface ClaimChipsProps {
  chips: ExplainableClaimChipModel[];
  calmMode?: boolean;
}

export default function ClaimChips({ chips, calmMode = true }: ClaimChipsProps) {
  if (chips.length === 0) {
    return null;
  }

  const getChipStyle = (severity: "info" | "warn" | "critical") => {
    if (calmMode) {
      // Calm colors
      return {
        backgroundColor: severity === 'critical' ? '#ffebee' :
                          severity === 'warn' ? '#fff3e0' :
                          '#e3f2fd',
        border: `1px solid ${severity === 'critical' ? '#d32f2f' :
                              severity === 'warn' ? '#ff9800' :
                              '#2196f3'}`,
        color: severity === 'critical' ? '#d32f2f' :
               severity === 'warn' ? '#ff9800' :
               '#1976d2'
      };
    }
    // Default styling
    return {
      backgroundColor: '#f5f5f5',
      border: '1px solid #ccc',
      color: '#000'
    };
  };

  return (
    <div style={{ marginBottom: spacing.md }}>
      <h3 style={{ fontSize: textSizes.body, marginBottom: spacing.sm }}>
        Why (Assurance Claims)
      </h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm }}>
        {chips.map((chip) => (
          <span
            key={chip.id}
            style={{
              padding: `${spacing.xs} ${spacing.sm}`,
              fontSize: textSizes.small,
              borderRadius: 4,
              ...getChipStyle(chip.severity)
            }}
          >
            {chip.text}
            {chip.count !== undefined && chip.count > 1 && (
              <span style={{ opacity: 0.7 }}> ({chip.count})</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}








































