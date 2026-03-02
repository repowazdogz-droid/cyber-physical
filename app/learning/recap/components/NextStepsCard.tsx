'use client';

import React from 'react';
import { SPACING, TEXT_SIZES, TAP_MIN_PX } from '../../ui/uiTokens';
import UiCard from '../../ui/UiCard';

interface NextStepsCardProps {
  sessionId: string;
  learnerId?: string;
  role?: 'learner' | 'teacher' | 'parent';
}

export default function NextStepsCard({
  sessionId,
  learnerId,
  role = 'learner'
}: NextStepsCardProps) {
  const steps = [];

  if (role === 'learner') {
    steps.push(
      {
        label: 'Continue learning',
        action: () => window.location.href = '/learning'
      },
      {
        label: 'Explain it back',
        action: () => window.location.href = `/learning?sessionId=${sessionId}&action=explain`
      }
    );

    if (learnerId) {
      steps.push({
        label: 'Share with teacher (permission)',
        action: () => window.location.href = `/learning/permissions?learnerId=${learnerId}`
      });
    }
  } else {
    // Teacher/parent view
    steps.push(
      {
        label: 'View another session',
        action: () => window.location.href = '/teacher/recap'
      },
      {
        label: 'Request access',
        action: () => window.location.href = `/teacher/recap?requestAccess=true&learnerId=${learnerId}`
      }
    );
  }

  // Limit to 3 steps max
  const displaySteps = steps.slice(0, 3);

  return (
    <UiCard style={{ marginTop: SPACING.large }}>
      <h3 style={{ fontSize: TEXT_SIZES.subheading, marginBottom: SPACING.standard.md }}>
        What to do next
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.small }}>
        {displaySteps.map((step, idx) => (
          <button
            key={idx}
            onClick={step.action}
            style={{
              padding: SPACING.standard.md,
              fontSize: TEXT_SIZES.body,
              backgroundColor: idx === 0 ? '#1976d2' : '#f5f5f5',
              color: idx === 0 ? 'white' : '#333',
              border: idx === 0 ? 'none' : '1px solid #ccc',
              borderRadius: 4,
              cursor: 'pointer',
              minHeight: TAP_MIN_PX,
              textAlign: 'left'
            }}
          >
            {step.label}
          </button>
        ))}
      </div>
    </UiCard>
  );
}








































