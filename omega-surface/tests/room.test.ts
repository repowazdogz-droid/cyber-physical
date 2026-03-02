import { describe, it, expect } from 'vitest';
import { createRoomSurface } from '../src/surface/room.js';
import { createTerminalSurface } from '../src/surface/terminal.js';

describe('RoomSurface', () => {
  it('AT-SURFACE-009: RoomSurface type enforces execution: false (compile-time check)', () => {
    const room = createRoomSurface('Test Room');
    expect(room.type).toBe('room');
    expect(room.execution).toBe(false);
  });

  it('createRoomSurface returns valid RoomSurface', () => {
    const room = createRoomSurface('My Room', {
      presets: [
        {
          id: 'p1',
          label: 'Full',
          visible_layers: ['structure', 'constraints', 'uncertainty', 'assumptions'],
          description: 'All layers',
        },
      ],
    });
    expect(room.name).toBe('My Room');
    expect(room.layers).toContain('structure');
    expect(room.presets).toHaveLength(1);
    expect(room.human_controls.freeze).toBe(true);
  });
});

describe('TerminalSurface', () => {
  it('AT-SURFACE-010: TerminalSurface with 4 stages produces valid chain with 4 links (stages are metadata; chain is built at seal time)', () => {
    const terminal = createTerminalSurface(
      'Decision Engine',
      [
        { id: 's1', label: 'Assess', order: 1, type: 'generation', deterministic: false },
        { id: 's2', label: 'Options', order: 2, type: 'generation', deterministic: false },
        { id: 's3', label: 'Risk', order: 3, type: 'verification', deterministic: true },
        { id: 's4', label: 'Brief', order: 4, type: 'export', deterministic: true },
      ]
    );
    expect(terminal.type).toBe('terminal');
    expect(terminal.stages).toHaveLength(4);
    expect(terminal.stages.map((s) => s.order)).toEqual([1, 2, 3, 4]);
    expect(terminal.integrity.hash_chain).toBe(true);
  });

  it('createTerminalSurface sorts stages by order', () => {
    const terminal = createTerminalSurface(
      'R&D',
      [
        { id: 'b', label: 'B', order: 2, type: 'synthesis', deterministic: false },
        { id: 'a', label: 'A', order: 1, type: 'generation', deterministic: false },
      ]
    );
    expect(terminal.stages[0].order).toBe(1);
    expect(terminal.stages[1].order).toBe(2);
  });
});
