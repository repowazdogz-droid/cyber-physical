-- REFLEXIVE API Storage v0.1.0
-- Migration 003: Add api_analyses table for API request/response storage

CREATE TABLE IF NOT EXISTS api_analyses (
    analysis_id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    request_json JSONB NOT NULL,
    response_json JSONB NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('completed', 'failed', 'dry_run')),
    duration_ms INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_api_analyses_created_at ON api_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_analyses_status ON api_analyses(status);
