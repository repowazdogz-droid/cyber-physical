import { query, pool } from './client.js';
import { v4 as uuidv4 } from 'uuid';

export interface LensConfig {
  id: string;
  name: string;
  orientation: 'convergent' | 'divergent' | 'orthogonal';
  system_prompt_template: string;
  version: number;
  active: boolean;
}

export interface Analysis {
  id: string;
  case_id: string;
  sequence_number: number;
  state: string;
  created_at: Date;
}

export interface Perspective {
  id: string;
  analysis_id: string;
  lens_id: string;
  lens_version: string;
  state: string;
  created_at: Date;
}

export async function getLenses(active_only: boolean = true): Promise<LensConfig[]> {
  const sql = active_only
    ? 'SELECT id, name, orientation, system_prompt_template, version::integer, is_active as active FROM lenses WHERE is_active = true ORDER BY name'
    : 'SELECT id, name, orientation, system_prompt_template, version::integer, is_active as active FROM lenses ORDER BY name';
  const result = await query(sql);
  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    orientation: row.orientation,
    system_prompt_template: row.system_prompt_template || '',
    version: row.version,
    active: row.active,
  }));
}

export async function createAnalysis(
  case_id: string,
  sequence_number: number,
  lens_config_snapshot?: Record<string, string>,
  context_snapshot_ids?: string[]
): Promise<Analysis> {
  const id = uuidv4();
  // For Phase 2, these columns may not exist yet, so we'll insert without them
  // They'll be added in migration 002
  const result = await query(
    `INSERT INTO analyses (id, case_id, sequence_number, state)
     VALUES ($1, $2, $3, 'pending')
     RETURNING id, case_id, sequence_number, state, created_at`,
    [id, case_id, sequence_number]
  );
  return result.rows[0];
}

export async function createPerspective(
  analysis_id: string,
  lens_id: string,
  lens_version: string
): Promise<Perspective> {
  const id = uuidv4();
  const result = await query(
    `INSERT INTO perspectives (id, analysis_id, lens_id, lens_version, state)
     VALUES ($1, $2, $3, $4, 'pending')
     RETURNING id, analysis_id, lens_id, lens_version, state, created_at`,
    [id, analysis_id, lens_id, lens_version]
  );
  return result.rows[0];
}

export async function updatePerspectiveState(
  id: string,
  state: string,
  raw_output?: unknown,
  started_at?: Date,
  completed_at?: Date
): Promise<void> {
  const updates: string[] = ['state = $2'];
  const params: unknown[] = [id, state];
  let paramIndex = 3;

  if (raw_output !== undefined) {
    updates.push(`raw_output = $${paramIndex}`);
    params.push(JSON.stringify(raw_output));
    paramIndex++;
  }
  if (started_at !== undefined) {
    updates.push(`started_at = $${paramIndex}`);
    params.push(started_at);
    paramIndex++;
  }
  if (completed_at !== undefined) {
    updates.push(`completed_at = $${paramIndex}`);
    params.push(completed_at);
    paramIndex++;
  }

  await query(
    `UPDATE perspectives SET ${updates.join(', ')} WHERE id = $1`,
    params
  );
}

export async function createTrace(
  perspective_id: string,
  lens_id: string,
  rendered_prompt: string,
  prompt_hash: string,
  model_name: string,
  model_parameters: Record<string, unknown>,
  raw_response: string | null,
  latency_ms: number,
  error_state: string | null
): Promise<void> {
  await query(
    `INSERT INTO traces (
      id, perspective_id, lens_id, prompt_hash, model_name, model_parameters,
      request_payload, response_payload, latency_ms, error_state
    ) VALUES (
      gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9
    )`,
    [
      perspective_id,
      lens_id,
      prompt_hash,
      model_name,
      JSON.stringify(model_parameters),
      JSON.stringify({ prompt: rendered_prompt }),
      JSON.stringify({ content: raw_response }),
      latency_ms,
      error_state,
    ]
  );
}

export interface ExtractedClaim {
  id: string;
  perspective_id: string;
  analysis_id: string;
  statement: string;
  category: string;
  claim_kind: string;
  confidence_weight: number;
  evidence_basis: string | null;
  evidence_status: string;
  about_entity_candidate: string;
  about_entity_canonical: string | null;
  validity: string;
  polarity: string | null;
  scoring_eligible: boolean;
  as_of: string;
  valid_from: string | null;
  valid_until: string | null;
  expires_at: string | null;
  stale_unsupported: boolean;
}

export async function insertClaim(claim: ExtractedClaim, case_id?: string): Promise<void> {
  // Build dynamic INSERT based on which fields are provided
  // valid_from has a NOT NULL constraint with DEFAULT NOW(), so omit it if null
  // Use provided case_id or fall back to claim.analysis_id (for backward compatibility)
  const actual_case_id = case_id || claim.analysis_id;
  
  const fields: string[] = [
    'id', 'perspective_id', 'case_id', 'category', 'content', 'confidence_weight',
    'evidence_status', 'about_entity_candidate', 'about_entity_canonical',
    'claim_kind', 'validity', 'polarity', 'scoring_eligible', 'as_of'
  ];
  const values: unknown[] = [
    claim.id,
    claim.perspective_id,
    actual_case_id, // case_id in schema
    claim.category,
    claim.statement, // content in schema
    claim.confidence_weight,
    claim.evidence_status,
    claim.about_entity_candidate,
    claim.about_entity_canonical,
    claim.claim_kind,
    claim.validity,
    claim.polarity,
    claim.scoring_eligible,
    claim.as_of,
  ];
  let paramIndex = fields.length + 1;
  
  // Add valid_from only if not null (otherwise use DB default)
  if (claim.valid_from !== null && claim.valid_from !== undefined) {
    fields.push('valid_from');
    values.push(claim.valid_from);
    paramIndex++;
  }
  
  // Add optional fields
  fields.push('valid_until', 'expires_at', 'stale_unsupported');
  values.push(claim.valid_until, claim.expires_at, claim.stale_unsupported);
  
  // If evidence_status is 'unsupported', review_by is required by constraint
  if (claim.evidence_status === 'unsupported') {
    // Set review_by to 30 days from now (same as expires_at logic)
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() + 30);
    fields.push('review_by');
    values.push(reviewDate);
  }
  
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
  
  await query(
    `INSERT INTO claims (${fields.join(', ')}) VALUES (${placeholders})`,
    values
  );
}

export async function insertClaims(claims: ExtractedClaim[], case_id?: string): Promise<void> {
  if (claims.length === 0) return;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const claim of claims) {
      await insertClaim(claim, case_id);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateClaimAnnotations(
  claim_id: string,
  updates: {
    about_entity_canonical: string | null;
    validity: string;
    polarity: string | null;
    scoring_eligible: boolean;
    expires_at: string | null;
    stale_unsupported: boolean;
  }
): Promise<void> {
  await query(
    `UPDATE claims SET
      about_entity_canonical = $2,
      validity = $3,
      polarity = $4,
      scoring_eligible = $5,
      expires_at = $6,
      stale_unsupported = $7
    WHERE id = $1`,
    [
      claim_id,
      updates.about_entity_canonical,
      updates.validity,
      updates.polarity,
      updates.scoring_eligible,
      updates.expires_at,
      updates.stale_unsupported,
    ]
  );
}

export async function getClaimEmbeddings(claim_ids: string[]): Promise<Map<string, number[]>> {
  if (claim_ids.length === 0) {
    return new Map();
  }

  const result = await query(
    `SELECT claim_id, embedding FROM claim_embeddings WHERE claim_id = ANY($1)`,
    [claim_ids]
  );

  const map = new Map<string, number[]>();
  for (const row of result.rows) {
    const embedding = typeof row.embedding === 'string'
      ? row.embedding.slice(1, -1).split(',').map(Number)
      : (row.embedding as number[]);
    map.set(row.claim_id as string, embedding);
  }
  return map;
}

export interface EvidenceItem {
  id: string;
  content_text: string;
  source_type: 'document' | 'measurement' | 'citation' | 'testimony' | 'observation'; // Database enum
  source: string | null;
  as_of: string;
  created_at: string;
}

export async function insertEvidenceItem(item: EvidenceItem): Promise<void> {
  await query(
    `INSERT INTO evidence_items (id, content, source, source_type, as_of, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      item.id,
      item.content_text,
      item.source,
      item.source_type, // Already mapped to DB enum
      item.as_of,
      item.created_at,
    ]
  );
}

export async function insertEvidenceItems(items: EvidenceItem[]): Promise<void> {
  if (items.length === 0) return;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const item of items) {
      await insertEvidenceItem(item);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export interface EvidenceLink {
  claim_id: string;
  evidence_item_id: string;
  support_type: 'supports' | 'undermines' | 'contextualizes'; // Database enum
}

export async function insertEvidenceLink(link: EvidenceLink): Promise<void> {
  await query(
    `INSERT INTO claim_evidence (claim_id, evidence_id, support_type)
     VALUES ($1, $2, $3)
     ON CONFLICT (claim_id, evidence_id) DO NOTHING`,
    [
      link.claim_id,
      link.evidence_item_id,
      link.support_type,
    ]
  );
}

export async function insertEvidenceLinks(links: EvidenceLink[]): Promise<void> {
  if (links.length === 0) return;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const link of links) {
      await insertEvidenceLink(link);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
