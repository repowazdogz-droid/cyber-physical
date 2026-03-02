import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ensureEmbeddings } from '../../src/embeddings/service.js';
import { getEmbedding } from '../../src/embeddings/client.js';
import { query } from '../../src/db/client.js';
import type { ExtractedClaim } from '../../src/extraction/types.js';

vi.mock('../../src/embeddings/client.js');
vi.mock('../../src/db/client.js');

function createClaim(id: string, scoring_eligible: boolean = true): ExtractedClaim {
  return {
    id,
    perspective_id: 'perspective-1',
    analysis_id: 'analysis-1',
    statement: `Claim ${id}`,
    category: 'factual',
    claim_kind: 'claim',
    confidence_weight: 0.5,
    evidence_basis: null,
    evidence_status: 'supported',
    about_entity_candidate: 'Entity',
    about_entity_canonical: null,
    validity: 'strict',
    polarity: null,
    scoring_eligible,
    as_of: '2025-02-07',
    valid_from: null,
    valid_until: null,
    expires_at: null,
    stale_unsupported: false,
    repairs: [],
  };
}

describe('ensureEmbeddings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns cached embeddings from DB without calling Ollama', async () => {
    const claims = [createClaim('claim-1')];
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          claim_id: 'claim-1',
          embedding: '{0.1,0.2,0.3}',
        },
      ],
    } as any);

    const result = await ensureEmbeddings(claims);

    expect(result.has('claim-1')).toBe(true);
    expect(result.get('claim-1')).toEqual([0.1, 0.2, 0.3]);
    expect(vi.mocked(getEmbedding)).not.toHaveBeenCalled();
  });

  it('calls Ollama for claims without cached embeddings', async () => {
    const claims = [createClaim('claim-1')];
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValueOnce({ rows: [] } as any); // No cached embeddings
    mockQuery.mockResolvedValueOnce({ rows: [] } as any); // INSERT result

    const mockGetEmbedding = vi.mocked(getEmbedding);
    mockGetEmbedding.mockResolvedValueOnce({
      embedding: [0.1, 0.2, 0.3],
      model: 'nomic-embed-text',
    });

    const result = await ensureEmbeddings(claims);

    expect(mockGetEmbedding).toHaveBeenCalledTimes(1);
    expect(result.has('claim-1')).toBe(true);
  });

  it('skips non-scoring claims', async () => {
    const claims = [
      createClaim('claim-1', false), // Non-scoring
      createClaim('claim-2', false), // Non-scoring
    ];
    // No query calls expected since no scoring claims

    const result = await ensureEmbeddings(claims);

    expect(vi.mocked(getEmbedding)).not.toHaveBeenCalled();
    expect(result.size).toBe(0);
  });

  it('retries on Ollama failure and succeeds', async () => {
    const claims = [createClaim('claim-1')];
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);

    const mockGetEmbedding = vi.mocked(getEmbedding);
    mockGetEmbedding.mockRejectedValueOnce(new Error('Network error'));
    mockGetEmbedding.mockResolvedValueOnce({
      embedding: [0.1, 0.2, 0.3],
      model: 'nomic-embed-text',
    });

    const result = await ensureEmbeddings(claims);

    expect(mockGetEmbedding).toHaveBeenCalledTimes(2);
    expect(result.has('claim-1')).toBe(true);
  });

  it('marks claim as non-scoring after retry failure', async () => {
    const claims = [createClaim('claim-1')];
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);

    const mockGetEmbedding = vi.mocked(getEmbedding);
    mockGetEmbedding.mockRejectedValueOnce(new Error('Network error'));
    mockGetEmbedding.mockRejectedValueOnce(new Error('Network error'));

    const result = await ensureEmbeddings(claims);

    expect(claims[0].scoring_eligible).toBe(false);
    expect(claims[0].repairs.some(r => r.includes('embedding_failed'))).toBe(true);
    expect(result.has('claim-1')).toBe(false);
  });
});
