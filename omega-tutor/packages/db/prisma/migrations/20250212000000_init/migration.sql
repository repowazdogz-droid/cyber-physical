-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('STANDARD', 'ADJUDICATION');

-- CreateEnum
CREATE TYPE "EdgeSource" AS ENUM ('SEEDED', 'LEARNED');

-- CreateEnum
CREATE TYPE "ProbeType" AS ENUM ('DIAGNOSTIC', 'ADJUDICATION', 'VERIFICATION', 'TRANSFER');

-- CreateEnum
CREATE TYPE "ProbeCreatedBy" AS ENUM ('SCHEDULER', 'ADJUDICATION', 'MANUAL');

-- CreateEnum
CREATE TYPE "ProbeStatus" AS ENUM ('PENDING', 'EXECUTED', 'SKIPPED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MisconceptionState" AS ENUM ('EMERGING', 'ACTIVE', 'REPAIRED_PROVISIONAL', 'REPAIRED_STABLE', 'DORMANT', 'DISCONFIRMED');

-- CreateEnum
CREATE TYPE "SchedulerQueueStatus" AS ENUM ('PENDING', 'DISPATCHED', 'EXECUTED', 'SKIPPED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('PENDING', 'ADJUDICATING', 'UPHELD', 'REJECTED');

-- CreateTable
CREATE TABLE "Learner" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT,

    CONSTRAINT "Learner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "learner_id" TEXT NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3),
    "session_type" "SessionType" NOT NULL DEFAULT 'STANDARD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Concept" (
    "id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Concept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concept_edges" (
    "id" TEXT NOT NULL,
    "from_concept_id" TEXT NOT NULL,
    "to_concept_id" TEXT NOT NULL,
    "edge_type" TEXT NOT NULL,
    "proximity_weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "source" "EdgeSource" NOT NULL DEFAULT 'SEEDED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "concept_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "config_versions" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "gating_min_observations" INTEGER NOT NULL,
    "gating_match_strength_threshold" DOUBLE PRECISION NOT NULL,
    "confidence_half_life_days" INTEGER NOT NULL,
    "scheduler_probe_ratio_cap" DOUBLE PRECISION NOT NULL,
    "scheduler_min_minutes_between" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "config_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "probes" (
    "id" TEXT NOT NULL,
    "type" "ProbeType" NOT NULL,
    "target_misconception_entry_id" TEXT,
    "target_concept_id" TEXT NOT NULL,
    "surface_form_family" TEXT NOT NULL,
    "prompt_content_ref" TEXT NOT NULL,
    "created_by" "ProbeCreatedBy" NOT NULL,
    "status" "ProbeStatus" NOT NULL DEFAULT 'PENDING',
    "executed_in_session_id" TEXT,
    "executed_at" TIMESTAMP(3),
    "result_observation_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "probes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observations" (
    "id" TEXT NOT NULL,
    "learner_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "probe_id" TEXT NOT NULL,
    "concept_id" TEXT NOT NULL,
    "raw_response" TEXT NOT NULL,
    "parsed_features" JSONB NOT NULL,
    "match_strength" DOUBLE PRECISION NOT NULL,
    "grammar_label" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MisconceptionEntry" (
    "id" TEXT NOT NULL,
    "learner_id" TEXT NOT NULL,
    "concept_id" TEXT NOT NULL,
    "grammar_label" TEXT NOT NULL,
    "state" "MisconceptionState" NOT NULL DEFAULT 'EMERGING',
    "confidence_score" DOUBLE PRECISION NOT NULL,
    "last_observed_at" TIMESTAMP(3),
    "last_contact_at" TIMESTAMP(3),
    "config_version_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MisconceptionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observation_misconception_entries" (
    "id" TEXT NOT NULL,
    "observation_id" TEXT NOT NULL,
    "misconception_entry_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "observation_misconception_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "misconception_entry_state_transitions" (
    "id" TEXT NOT NULL,
    "misconception_entry_id" TEXT NOT NULL,
    "to_state" "MisconceptionState" NOT NULL,
    "config_version_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "misconception_entry_state_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "misconception_targets" (
    "id" TEXT NOT NULL,
    "concept_id" TEXT NOT NULL,
    "grammar_label" TEXT NOT NULL,
    "surface_form_family" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "misconception_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repairs" (
    "id" TEXT NOT NULL,
    "misconception_entry_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "intervention_type" TEXT NOT NULL,
    "content_ref" TEXT NOT NULL,
    "attempted_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "verification_probe_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repairs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_transfer_probes" (
    "repair_id" TEXT NOT NULL,
    "probe_id" TEXT NOT NULL,

    CONSTRAINT "repair_transfer_probes_pkey" PRIMARY KEY ("repair_id","probe_id")
);

-- CreateTable
CREATE TABLE "scheduler_queue_items" (
    "id" TEXT NOT NULL,
    "probe_id" TEXT NOT NULL,
    "learner_id" TEXT NOT NULL,
    "priority_score" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "status" "SchedulerQueueStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduler_queue_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL,
    "misconception_entry_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_claim" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Learner_email_key" ON "Learner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Concept_external_id_key" ON "Concept"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "concept_edges_from_concept_id_to_concept_id_edge_type_key" ON "concept_edges"("from_concept_id", "to_concept_id", "edge_type");

-- CreateIndex
CREATE UNIQUE INDEX "config_versions_version_key" ON "config_versions"("version");

-- CreateIndex
CREATE UNIQUE INDEX "probes_result_observation_id_key" ON "probes"("result_observation_id");

-- CreateIndex
CREATE UNIQUE INDEX "observation_misconception_entries_observation_id_misconcept_key" ON "observation_misconception_entries"("observation_id", "misconception_entry_id");

-- CreateIndex
CREATE UNIQUE INDEX "misconception_targets_concept_id_grammar_label_surface_form_key" ON "misconception_targets"("concept_id", "grammar_label", "surface_form_family");

-- CreateIndex
CREATE UNIQUE INDEX "disputes_misconception_entry_id_session_id_key" ON "disputes"("misconception_entry_id", "session_id");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept_edges" ADD CONSTRAINT "concept_edges_from_concept_id_fkey" FOREIGN KEY ("from_concept_id") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept_edges" ADD CONSTRAINT "concept_edges_to_concept_id_fkey" FOREIGN KEY ("to_concept_id") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "probes" ADD CONSTRAINT "probes_target_misconception_entry_id_fkey" FOREIGN KEY ("target_misconception_entry_id") REFERENCES "MisconceptionEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "probes" ADD CONSTRAINT "probes_target_concept_id_fkey" FOREIGN KEY ("target_concept_id") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "probes" ADD CONSTRAINT "probes_executed_in_session_id_fkey" FOREIGN KEY ("executed_in_session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "probes" ADD CONSTRAINT "probes_result_observation_id_fkey" FOREIGN KEY ("result_observation_id") REFERENCES "observations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observations" ADD CONSTRAINT "observations_probe_id_fkey" FOREIGN KEY ("probe_id") REFERENCES "probes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observations" ADD CONSTRAINT "observations_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observations" ADD CONSTRAINT "observations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observations" ADD CONSTRAINT "observations_concept_id_fkey" FOREIGN KEY ("concept_id") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MisconceptionEntry" ADD CONSTRAINT "MisconceptionEntry_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MisconceptionEntry" ADD CONSTRAINT "MisconceptionEntry_concept_id_fkey" FOREIGN KEY ("concept_id") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MisconceptionEntry" ADD CONSTRAINT "MisconceptionEntry_config_version_id_fkey" FOREIGN KEY ("config_version_id") REFERENCES "config_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observation_misconception_entries" ADD CONSTRAINT "observation_misconception_entries_observation_id_fkey" FOREIGN KEY ("observation_id") REFERENCES "observations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observation_misconception_entries" ADD CONSTRAINT "observation_misconception_entries_misconception_entry_id_fkey" FOREIGN KEY ("misconception_entry_id") REFERENCES "MisconceptionEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "misconception_entry_state_transitions" ADD CONSTRAINT "misconception_entry_state_transitions_misconception_entry__fkey" FOREIGN KEY ("misconception_entry_id") REFERENCES "MisconceptionEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "misconception_entry_state_transitions" ADD CONSTRAINT "misconception_entry_state_transitions_config_version_id_fkey" FOREIGN KEY ("config_version_id") REFERENCES "config_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "misconception_targets" ADD CONSTRAINT "misconception_targets_concept_id_fkey" FOREIGN KEY ("concept_id") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_misconception_entry_id_fkey" FOREIGN KEY ("misconception_entry_id") REFERENCES "MisconceptionEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_verification_probe_id_fkey" FOREIGN KEY ("verification_probe_id") REFERENCES "probes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_transfer_probes" ADD CONSTRAINT "repair_transfer_probes_repair_id_fkey" FOREIGN KEY ("repair_id") REFERENCES "repairs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_transfer_probes" ADD CONSTRAINT "repair_transfer_probes_probe_id_fkey" FOREIGN KEY ("probe_id") REFERENCES "probes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduler_queue_items" ADD CONSTRAINT "scheduler_queue_items_probe_id_fkey" FOREIGN KEY ("probe_id") REFERENCES "probes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduler_queue_items" ADD CONSTRAINT "scheduler_queue_items_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_misconception_entry_id_fkey" FOREIGN KEY ("misconception_entry_id") REFERENCES "MisconceptionEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

