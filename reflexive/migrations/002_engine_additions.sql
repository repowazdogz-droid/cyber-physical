-- REFLEXIVE Engine Additions (Artifact 04 §10.2)
-- Adds columns and tables required by the reasoning engine

-- Claim embeddings sidecar table
CREATE TABLE IF NOT EXISTS claim_embeddings (
  claim_id UUID PRIMARY KEY REFERENCES claims(id),
  embedding float8[] NOT NULL,
  model_id TEXT NOT NULL DEFAULT 'nomic-embed-text',
  dimensions INTEGER NOT NULL DEFAULT 768,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Engine-specific columns on claims
ALTER TABLE claims ADD COLUMN IF NOT EXISTS about_entity_candidate TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS about_entity_canonical TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS claim_kind TEXT NOT NULL DEFAULT 'claim'
  CHECK (claim_kind IN ('claim', 'assumption'));
ALTER TABLE claims ADD COLUMN IF NOT EXISTS validity TEXT NOT NULL DEFAULT 'strict'
  CHECK (validity IN ('strict', 'repaired', 'invalid'));
ALTER TABLE claims ADD COLUMN IF NOT EXISTS polarity TEXT
  CHECK (polarity IN ('positive', 'negative', 'neutral'));
ALTER TABLE claims ADD COLUMN IF NOT EXISTS scoring_eligible BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS stale_unsupported BOOLEAN NOT NULL DEFAULT false;

-- Synthesis additions
ALTER TABLE syntheses ADD COLUMN IF NOT EXISTS drift_report JSONB;
ALTER TABLE syntheses ADD COLUMN IF NOT EXISTS orphan_claims JSONB;

-- Indexes for engine query patterns
CREATE INDEX IF NOT EXISTS idx_claim_embeddings_claim_id ON claim_embeddings(claim_id);
CREATE INDEX IF NOT EXISTS idx_claims_about_entity_canonical ON claims(about_entity_canonical);
CREATE INDEX IF NOT EXISTS idx_claims_validity ON claims(validity);
CREATE INDEX IF NOT EXISTS idx_claims_scoring_eligible ON claims(scoring_eligible) WHERE scoring_eligible = true;
CREATE INDEX IF NOT EXISTS idx_claims_perspective_id ON claims(perspective_id);

-- Add system_prompt_template column to lenses if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lenses' AND column_name = 'system_prompt_template'
  ) THEN
    ALTER TABLE lenses ADD COLUMN system_prompt_template TEXT;
  END IF;
END $$;

-- Add columns to analyses table if they don't exist (for Phase 6)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analyses' AND column_name = 'lens_config_snapshot'
  ) THEN
    ALTER TABLE analyses ADD COLUMN lens_config_snapshot JSONB;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analyses' AND column_name = 'context_snapshot_ids'
  ) THEN
    ALTER TABLE analyses ADD COLUMN context_snapshot_ids JSONB;
  END IF;
END $$;
