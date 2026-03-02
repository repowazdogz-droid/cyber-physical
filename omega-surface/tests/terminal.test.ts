import { describe, it, expect } from 'vitest';
import { createTerminalSurface } from '../src/surface/terminal.js';

describe('terminal', () => {
  it('TerminalSurface with 4 stages has 4 stages (AT-SURFACE-010)', () => {
    const terminal = createTerminalSurface(
      'Test',
      [
        { id: '1', label: 'One', order: 1, type: 'generation', deterministic: false },
        { id: '2', label: 'Two', order: 2, type: 'verification', deterministic: true },
        { id: '3', label: 'Three', order: 3, type: 'synthesis', deterministic: false },
        { id: '4', label: 'Four', order: 4, type: 'export', deterministic: true },
      ]
    );
    expect(terminal.stages).toHaveLength(4);
  });
});
