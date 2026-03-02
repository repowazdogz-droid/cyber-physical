-- REFLEXIVE Synthesis Columns v0.1.0
-- Migration 004: Add missing columns to syntheses table required by writeSynthesis

-- Add confidence_breakdown (JSONB) - stores detailed confidence calculation breakdown
ALTER TABLE syntheses ADD COLUMN IF NOT EXISTS confidence_breakdown JSONB;

-- Add confidence_rationale (TEXT) - stores human-readable explanation of confidence score
ALTER TABLE syntheses ADD COLUMN IF NOT EXISTS confidence_rationale TEXT;

-- Add computed_at (TIMESTAMP) - stores when synthesis was computed (for drift detection)
ALTER TABLE syntheses ADD COLUMN IF NOT EXISTS computed_at TIMESTAMP;
