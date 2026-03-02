/**
 * Event labels: Human-readable labels for learning events.
 * No scoring, no judgment, just what happened.
 */

export interface EventLabel {
  label: string;
  description?: string;
  category: 'interaction' | 'focus' | 'organization' | 'reflection';
}

export const EVENT_LABELS: Record<string, EventLabel> = {
  CardSelected: {
    label: 'Selected a thought',
    description: 'Looked at a specific idea',
    category: 'interaction'
  },
  FocusEntered: {
    label: 'Focused on a thought',
    description: 'Brought one idea forward to examine closely',
    category: 'focus'
  },
  FocusExited: {
    label: 'Returned to overview',
    description: 'Went back to seeing all thoughts',
    category: 'focus'
  },
  ClusterChanged: {
    label: 'Filtered thoughts',
    description: 'Narrowed view to a specific type',
    category: 'organization'
  },
  PinToggled: {
    label: 'Pinned a thought',
    description: 'Saved an idea to the top shelf',
    category: 'organization'
  },
  ExplainBackShown: {
    label: 'Explained an idea in their own words',
    description: 'Practiced teaching back what they learned',
    category: 'reflection'
  },
  SpotlightShown: {
    label: 'Teacher highlighted a thought',
    description: 'A specific idea was brought to attention',
    category: 'interaction'
  },
  SpotlightDismissed: {
    label: 'Dismissed spotlight',
    description: 'Returned to independent exploration',
    category: 'interaction'
  },
  DemoStepAdvanced: {
    label: 'Completed a demo step',
    description: 'Moved through the guided tour',
    category: 'interaction'
  }
};

/**
 * Gets a human-readable label for an event type.
 */
export function getEventLabel(eventType: string): EventLabel {
  return EVENT_LABELS[eventType] || {
    label: eventType,
    description: 'An interaction occurred',
    category: 'interaction'
  };
}

/**
 * Gets a short summary of events by category.
 */
export function summarizeEvents(events: Array<{ type: string }>): string[] {
  const byCategory: Record<string, number> = {
    interaction: 0,
    focus: 0,
    organization: 0,
    reflection: 0
  };

  events.forEach(event => {
    const label = getEventLabel(event.type);
    byCategory[label.category] = (byCategory[label.category] || 0) + 1;
  });

  const summary: string[] = [];

  if (byCategory.focus > 0) {
    summary.push(`Focused on ${byCategory.focus} thought${byCategory.focus > 1 ? 's' : ''}`);
  }

  if (byCategory.organization > 0) {
    summary.push(`Organized ${byCategory.organization} thought${byCategory.organization > 1 ? 's' : ''}`);
  }

  if (byCategory.reflection > 0) {
    summary.push(`Reflected on ${byCategory.reflection} idea${byCategory.reflection > 1 ? 's' : ''}`);
  }

  if (byCategory.interaction > 0) {
    summary.push(`Interacted ${byCategory.interaction} time${byCategory.interaction > 1 ? 's' : ''}`);
  }

  return summary.length > 0 ? summary : ['Explored the learning board'];
}
