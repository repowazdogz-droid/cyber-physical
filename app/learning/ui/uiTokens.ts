// UI Design Tokens
// Centralized constants for spacing, typography, and layout

export type ReadingMode = 'calm' | 'standard' | 'dense';

// Text sizes
const TEXT_SIZES_BASE = {
  heading: '1.5rem',
  subheading: '1.25rem',
  body: '1rem',
  small: '0.875rem',
  h1: '1.5rem',
  h2: '1.25rem',
  h3: '1.125rem',
} as const;

export const TEXT_SIZES = {
  ...TEXT_SIZES_BASE,
  standard: TEXT_SIZES_BASE,
} as typeof TEXT_SIZES_BASE & {
  standard: typeof TEXT_SIZES_BASE;
};

// Spacing tokens (mode-based)
const SPACING_MODES = {
  calm: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  standard: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    large: '24px',
    small: '8px',
  },
  dense: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
} as const;

// Export SPACING with both mode-based access and direct access (defaults to standard)
export const SPACING = {
  ...SPACING_MODES,
  // Direct access defaults to standard mode values
  large: SPACING_MODES.standard.large,
  small: SPACING_MODES.standard.small,
} as typeof SPACING_MODES & {
  large: string;
  small: string;
};

// Card padding (mode-based)
export const CARD_PADDING = {
  calm: '24px',
  standard: '16px',
  dense: '12px',
} as const;

// Layout constants
export const MAX_LINE_WIDTH = '980px';
export const TAP_MIN_PX = 44;
export const CHIP_ROWS_MAX = 3;
