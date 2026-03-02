-- REFLEXIVE Schema v0.1.0
-- Postgres 16 DDL
-- Migration tool: node-pg-migrate

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum Types
CREATE TYPE case_state AS ENUM ('draft', 'active', 'archived');
CREATE TYPE stimulus_type AS ENUM ('decision_request', 'assessment_request', 'research_question', 'problem_statement');
CREATE TYPE analysis_state AS ENUM ('pending', 'running', 'completed', 'failed', 'partial');
CREATE TYPE perspective_state AS ENUM ('pending', 'running', 'completed', 'failed');
CREATE TYPE lens_orientation AS ENUM ('convergent', 'divergent', 'orthogonal');
CREATE TYPE claim_category AS ENUM ('factual', 'inferential', 'evaluative', 'predictive', 'assumption');
CREATE TYPE evidence_status AS ENUM ('supported', 'unsupported', 'contested', 'superseded');
CREATE TYPE support_type AS ENUM ('supports', 'undermines', 'contextualizes');
CREATE TYPE claim_relationship_type AS ENUM ('supports', 'contradicts', 'refines', 'depends_on');
CREATE TYPE decision_state AS ENUM ('draft', 'proposed', 'adopted', 'rejected', 'superseded');
CREATE TYPE outcome_status AS ENUM ('unknown', 'success', 'partial_success', 'failure', 'inconclusive');
CREATE TYPE outcome_event_type AS ENUM ('status_change', 'observation', 'measurement', 'correction');
CREATE TYPE source_type AS ENUM ('document', 'measurement', 'citation', 'testimony', 'observation');
CREATE TYPE unknown_status AS ENUM ('identified', 'resolved', 'deferred');
CREATE TYPE risk_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE risk_likelihood AS ENUM ('unlikely', 'possible', 'likely', 'very_likely');
CREATE TYPE constraint_type AS ENUM ('resource', 'temporal', 'regulatory', 'technical', 'organizational');
CREATE TYPE test_status AS ENUM ('proposed', 'pending', 'completed', 'failed', 'cancelled');
CREATE TYPE target_type AS ENUM ('unknown', 'claim', 'risk');
CREATE TYPE eval_type AS ENUM ('accuracy', 'calibration', 'outcome_alignment', 'process_quality');
CREATE TYPE eval_target_type AS ENUM ('case', 'analysis', 'decision', 'outcome');
CREATE TYPE predecessor_relationship_type AS ENUM ('evolves', 'references', 'supersedes');

-- Tables
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID,
    title TEXT NOT NULL,
    stimulus_type stimulus_type NOT NULL,
    stimulus_content TEXT NOT NULL,
    state case_state NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMP
);

CREATE TABLE contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL UNIQUE REFERENCES cases(id) ON DELETE RESTRICT,
    domain TEXT,
    key_entities JSONB,
    relevant_history TEXT,
    assumptions_initial JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE lenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    version TEXT NOT NULL,
    orientation lens_orientation NOT NULL,
    analytical_angle TEXT NOT NULL,
    prompt_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(name, version)
);

CREATE TABLE analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE RESTRICT,
    sequence_number INTEGER NOT NULL CHECK (sequence_number >= 1),
    state analysis_state NOT NULL DEFAULT 'pending',
    confidence_score FLOAT CHECK (confidence_score IS NULL OR (confidence_score >= 0.0 AND confidence_score <= 1.0)),
    confidence_breakdown JSONB,
    -- confidence_breakdown schema: {lens_id: confidence_score}
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(case_id, sequence_number)
);

CREATE TABLE perspectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE RESTRICT,
    lens_id UUID NOT NULL REFERENCES lenses(id) ON DELETE RESTRICT,
    lens_version TEXT NOT NULL,
    state perspective_state NOT NULL DEFAULT 'pending',
    raw_output JSONB,
    extracted_claims_count INTEGER DEFAULT 0,
    extracted_evidence_count INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perspective_id UUID REFERENCES perspectives(id) ON DELETE SET NULL,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE RESTRICT,
    category claim_category NOT NULL,
    content TEXT NOT NULL,
    confidence_weight FLOAT NOT NULL CHECK (confidence_weight >= 0.0 AND confidence_weight <= 1.0),
    evidence_status evidence_status NOT NULL DEFAULT 'supported',
    review_by TIMESTAMP,
    as_of TIMESTAMP NOT NULL DEFAULT NOW(),
    valid_from TIMESTAMP NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMP,
    possibly_stale BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CHECK (valid_until IS NULL OR valid_until >= valid_from),
    CHECK (evidence_status != 'unsupported' OR review_by IS NOT NULL)
);

CREATE TABLE evidence_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    source TEXT,
    source_type source_type NOT NULL,
    as_of TIMESTAMP NOT NULL DEFAULT NOW(),
    valid_from TIMESTAMP NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMP,
    possibly_stale BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CHECK (valid_until IS NULL OR valid_until >= valid_from)
);

CREATE TABLE decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    statement TEXT NOT NULL,
    state decision_state NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    adopted_at TIMESTAMP
);

CREATE TABLE outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID NOT NULL UNIQUE REFERENCES decisions(id) ON DELETE RESTRICT,
    status outcome_status NOT NULL DEFAULT 'unknown',
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE outcome_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outcome_id UUID NOT NULL REFERENCES outcomes(id) ON DELETE RESTRICT,
    sequence_number INTEGER NOT NULL CHECK (sequence_number >= 1),
    event_type outcome_event_type NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(outcome_id, sequence_number)
);

CREATE TABLE unknowns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    status unknown_status NOT NULL DEFAULT 'identified',
    resolved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    severity risk_severity NOT NULL,
    likelihood risk_likelihood NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE constraints_ (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE RESTRICT,
    type constraint_type NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    status test_status NOT NULL DEFAULT 'proposed',
    result TEXT,
    as_of TIMESTAMP,
    valid_from TIMESTAMP NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CHECK (valid_until IS NULL OR valid_until >= valid_from)
);

CREATE TABLE syntheses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL UNIQUE REFERENCES analyses(id) ON DELETE RESTRICT,
    confidence_score FLOAT CHECK (confidence_score IS NULL OR (confidence_score >= 0.0 AND confidence_score <= 1.0)),
    convergence_points JSONB NOT NULL DEFAULT '[]',
    -- convergence_points schema: [claim_id UUID]
    divergence_points JSONB NOT NULL DEFAULT '[]',
    -- divergence_points schema: [claim_id UUID]
    summary TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE traces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perspective_id UUID NOT NULL REFERENCES perspectives(id) ON DELETE RESTRICT,
    lens_id UUID NOT NULL REFERENCES lenses(id) ON DELETE RESTRICT,
    prompt_hash TEXT NOT NULL,
    model_name TEXT NOT NULL,
    model_parameters JSONB NOT NULL,
    -- model_parameters schema: {temperature: float, max_tokens: integer, ...}
    request_payload JSONB NOT NULL,
    response_payload JSONB NOT NULL,
    latency_ms INTEGER NOT NULL,
    error_state TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type eval_target_type NOT NULL,
    target_id UUID NOT NULL,
    type eval_type NOT NULL,
    findings JSONB NOT NULL,
    -- findings schema: variable, evaluation-specific
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Link Tables
CREATE TABLE decision_claims (
    decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE RESTRICT,
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE RESTRICT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (decision_id, claim_id)
);

CREATE TABLE claim_claims (
    claim_from_id UUID NOT NULL REFERENCES claims(id) ON DELETE RESTRICT,
    claim_to_id UUID NOT NULL REFERENCES claims(id) ON DELETE RESTRICT,
    relationship_type claim_relationship_type NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (claim_from_id, claim_to_id),
    CHECK (claim_from_id != claim_to_id)
);

CREATE TABLE claim_evidence (
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE RESTRICT,
    evidence_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE RESTRICT,
    support_type support_type NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (claim_id, evidence_id)
);

CREATE TABLE decision_cases (
    decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE RESTRICT,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE RESTRICT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (decision_id, case_id)
);

CREATE TABLE test_targets (
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE RESTRICT,
    target_type target_type NOT NULL,
    target_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (test_id, target_type, target_id)
);

CREATE TABLE case_predecessors (
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE RESTRICT,
    predecessor_case_id UUID NOT NULL REFERENCES cases(id) ON DELETE RESTRICT,
    relationship_type predecessor_relationship_type NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (case_id, predecessor_case_id),
    CHECK (case_id != predecessor_case_id)
);

-- Indexes
CREATE INDEX idx_cases_state ON cases(state);
CREATE INDEX idx_cases_owner_id ON cases(owner_id);
CREATE INDEX idx_cases_created_at ON cases(created_at);

CREATE INDEX idx_contexts_case_id ON contexts(case_id);

CREATE INDEX idx_analyses_case_id ON analyses(case_id);
CREATE INDEX idx_analyses_state ON analyses(state);
CREATE INDEX idx_analyses_created_at ON analyses(created_at);

CREATE INDEX idx_perspectives_analysis_id ON perspectives(analysis_id);
CREATE INDEX idx_perspectives_lens_id ON perspectives(lens_id);
CREATE INDEX idx_perspectives_lens_version ON perspectives(lens_id, lens_version);
CREATE INDEX idx_perspectives_state ON perspectives(state);

CREATE INDEX idx_claims_case_id ON claims(case_id);
CREATE INDEX idx_claims_perspective_id ON claims(perspective_id);
CREATE INDEX idx_claims_category ON claims(category);
CREATE INDEX idx_claims_evidence_status ON claims(evidence_status);
CREATE INDEX idx_claims_as_of ON claims(as_of);
CREATE INDEX idx_claims_possibly_stale ON claims(possibly_stale);

CREATE INDEX idx_evidence_items_as_of ON evidence_items(as_of);
CREATE INDEX idx_evidence_items_possibly_stale ON evidence_items(possibly_stale);

CREATE INDEX idx_decisions_state ON decisions(state);
CREATE INDEX idx_decisions_created_at ON decisions(created_at);

CREATE INDEX idx_outcomes_decision_id ON outcomes(decision_id);
CREATE INDEX idx_outcomes_status ON outcomes(status);

CREATE INDEX idx_outcome_events_outcome_id ON outcome_events(outcome_id);
CREATE INDEX idx_outcome_events_sequence ON outcome_events(outcome_id, sequence_number);

CREATE INDEX idx_unknowns_case_id ON unknowns(case_id);
CREATE INDEX idx_unknowns_status ON unknowns(status);

CREATE INDEX idx_risks_case_id ON risks(case_id);
CREATE INDEX idx_risks_severity ON risks(severity);

CREATE INDEX idx_constraints_case_id ON constraints_(case_id);

CREATE INDEX idx_tests_case_id ON tests(case_id);
CREATE INDEX idx_tests_status ON tests(status);

CREATE INDEX idx_syntheses_analysis_id ON syntheses(analysis_id);

CREATE INDEX idx_traces_perspective_id ON traces(perspective_id);
CREATE INDEX idx_traces_lens_id ON traces(lens_id);
CREATE INDEX idx_traces_prompt_hash ON traces(prompt_hash);
CREATE INDEX idx_traces_created_at ON traces(created_at);

CREATE INDEX idx_evaluations_target ON evaluations(target_type, target_id);

CREATE INDEX idx_decision_claims_decision_id ON decision_claims(decision_id);
CREATE INDEX idx_decision_claims_claim_id ON decision_claims(claim_id);

CREATE INDEX idx_claim_claims_from ON claim_claims(claim_from_id);
CREATE INDEX idx_claim_claims_to ON claim_claims(claim_to_id);

CREATE INDEX idx_claim_evidence_claim_id ON claim_evidence(claim_id);
CREATE INDEX idx_claim_evidence_evidence_id ON claim_evidence(evidence_id);

CREATE INDEX idx_decision_cases_decision_id ON decision_cases(decision_id);
CREATE INDEX idx_decision_cases_case_id ON decision_cases(case_id);

CREATE INDEX idx_test_targets_test_id ON test_targets(test_id);
CREATE INDEX idx_test_targets_target ON test_targets(target_type, target_id);

CREATE INDEX idx_case_predecessors_case_id ON case_predecessors(case_id);
CREATE INDEX idx_case_predecessors_predecessor ON case_predecessors(predecessor_case_id);

-- Trigger: Ensure Outcome created when Decision is inserted
-- Note: Application-level enforcement recommended (transactional), but trigger provided as safety net
CREATE OR REPLACE FUNCTION ensure_outcome_on_decision()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO outcomes (decision_id, status)
    VALUES (NEW.id, 'unknown')
    ON CONFLICT (decision_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_outcome_on_decision
    AFTER INSERT ON decisions
    FOR EACH ROW
    EXECUTE FUNCTION ensure_outcome_on_decision();

-- Trigger: Update cases.updated_at on update
CREATE OR REPLACE FUNCTION update_cases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION update_cases_updated_at();

-- Trigger: Update outcomes.updated_at on update
CREATE OR REPLACE FUNCTION update_outcomes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_outcomes_updated_at
    BEFORE UPDATE ON outcomes
    FOR EACH ROW
    EXECUTE FUNCTION update_outcomes_updated_at();
