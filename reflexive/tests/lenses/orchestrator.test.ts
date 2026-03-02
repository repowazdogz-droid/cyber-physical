import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invokeLenses } from '../../src/lenses/orchestrator.js';
import { callLLM } from '../../src/lenses/llm-client.js';
import { createPerspective, updatePerspectiveState, createTrace } from '../../src/db/queries.js';

// Mock dependencies
vi.mock('../../src/lenses/llm-client.js');
vi.mock('../../src/db/queries.js');

describe('invokeLenses', () => {
  const mockLenses = [
    {
      id: 'lens-1',
      name: 'analytical',
      orientation: 'convergent' as const,
      system_prompt_template: 'Template 1',
      version: 1,
      active: true,
    },
    {
      id: 'lens-2',
      name: 'adversarial',
      orientation: 'divergent' as const,
      system_prompt_template: 'Template 2',
      version: 1,
      active: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invokes all lenses in parallel', async () => {
    const mockCallLLM = vi.mocked(callLLM);
    mockCallLLM.mockResolvedValue({
      content: '{"conclusion": "Test", "claims": []}',
      model: 'test-model',
      usage: { input_tokens: 100, output_tokens: 50 },
    });

    const mockCreatePerspective = vi.mocked(createPerspective);
    mockCreatePerspective.mockResolvedValue({
      id: 'perspective-1',
      analysis_id: 'analysis-1',
      lens_id: 'lens-1',
      lens_version: '1',
      state: 'pending',
      created_at: new Date(),
    });

    const mockUpdatePerspectiveState = vi.mocked(updatePerspectiveState);
    mockUpdatePerspectiveState.mockResolvedValue(undefined);

    const mockCreateTrace = vi.mocked(createTrace);
    mockCreateTrace.mockResolvedValue(undefined);

    const results = await invokeLenses(
      mockLenses,
      'analysis-1',
      'Test stimulus',
      'decision_request',
      [],
      '2025-02-07'
    );

    expect(results).toHaveLength(2);
    expect(results[0].state).toBe('completed');
    expect(results[1].state).toBe('completed');
    expect(mockCallLLM).toHaveBeenCalledTimes(2);
  });

  it('retries on timeout', async () => {
    const mockCallLLM = vi.mocked(callLLM);
    mockCallLLM
      .mockRejectedValueOnce(new Error('LLM call timed out'))
      .mockRejectedValueOnce(new Error('LLM call timed out'))
      .mockRejectedValueOnce(new Error('LLM call timed out'));

    const mockCreatePerspective = vi.mocked(createPerspective);
    mockCreatePerspective.mockResolvedValue({
      id: 'perspective-1',
      analysis_id: 'analysis-1',
      lens_id: 'lens-1',
      lens_version: '1',
      state: 'pending',
      created_at: new Date(),
    });

    const mockUpdatePerspectiveState = vi.mocked(updatePerspectiveState);
    mockUpdatePerspectiveState.mockResolvedValue(undefined);

    const mockCreateTrace = vi.mocked(createTrace);
    mockCreateTrace.mockResolvedValue(undefined);

    const results = await invokeLenses(
      [mockLenses[0]],
      'analysis-1',
      'Test',
      'decision_request',
      [],
      '2025-02-07'
    );

    expect(results[0].state).toBe('failed');
    expect(results[0].attempts).toBe(3); // Initial + 2 retries
    expect(results[0].error).toContain('timed out');
  });
});
