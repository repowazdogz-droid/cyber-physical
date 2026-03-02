/**
 * Domain Enums
 * 
 * Supported domains for OPLAS tasks.
 * Must be explicitly declared (no implicit).
 * 
 * Version: 1.0.0
 */

export enum Domain {
  /** 2D grid-based tasks */
  GRID_2D = 'grid_2d',
  /** Text-based tasks */
  TEXT = 'text',
  /** Table-based tasks */
  TABLE = 'table',
  /** Generic state-based tasks */
  GENERIC_STATE = 'generic_state'
}

/**
 * Domain-specific node types (per domain).
 */
export const DomainNodeTypes: Record<Domain, string[]> = {
  [Domain.GRID_2D]: ['cell', 'object', 'region', 'boundary'],
  [Domain.TEXT]: ['token', 'word', 'sentence', 'paragraph'],
  [Domain.TABLE]: ['cell', 'row', 'column', 'header'],
  [Domain.GENERIC_STATE]: ['state', 'transition', 'event']
};

/**
 * Domain-specific edge types (per domain).
 */
export const DomainEdgeTypes: Record<Domain, string[]> = {
  [Domain.GRID_2D]: ['adjacent', 'contains', 'overlaps', 'connects'],
  [Domain.TEXT]: ['follows', 'contains', 'references'],
  [Domain.TABLE]: ['adjacent', 'contains', 'references'],
  [Domain.GENERIC_STATE]: ['transitions_to', 'triggers', 'enables']
};























