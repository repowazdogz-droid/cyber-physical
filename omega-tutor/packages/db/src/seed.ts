/**
 * Omega Tutor V1 — seed Intro Mechanics domain
 * Concepts, ConceptEdges, MisconceptionTargets, ConfigVersion, probe template refs
 */
import path from "node:path";
import { config as loadEnv } from "dotenv";

// Load .env from omega-tutor root when running from packages/db (e.g. npm run seed)
loadEnv({ path: path.resolve(process.cwd(), "../../.env") });
loadEnv({ path: path.resolve(process.cwd(), "../.env") });
loadEnv(); // fallback: .env in cwd

import { prisma } from "./index";

const CONCEPTS = [
  { externalId: "kinematics", name: "Kinematics", description: "Motion described by position, velocity, acceleration" },
  { externalId: "position", name: "Position and displacement", description: "Describing where an object is" },
  { externalId: "velocity", name: "Velocity", description: "Rate of change of position" },
  { externalId: "acceleration", name: "Acceleration", description: "Rate of change of velocity" },
  { externalId: "newton_first", name: "Newton's first law", description: "Inertia; no net force implies constant velocity" },
  { externalId: "newton_second", name: "Newton's second law", description: "F = ma" },
  { externalId: "newton_third", name: "Newton's third law", description: "Action-reaction pairs" },
  { externalId: "friction", name: "Friction", description: "Contact force opposing relative motion" },
  { externalId: "projectile_motion", name: "Projectile motion", description: "Motion under gravity with horizontal launch" },
  { externalId: "circular_motion", name: "Circular motion", description: "Centripetal acceleration and force" },
  { externalId: "momentum", name: "Momentum", description: "p = mv; conservation" },
  { externalId: "energy_basics", name: "Energy basics", description: "Kinetic energy, work, conservation" },
];

const EDGES: Array<{ from: string; to: string; edgeType: string; weight: number }> = [
  { from: "kinematics", to: "position", edgeType: "PREREQUISITE", weight: 1 },
  { from: "kinematics", to: "velocity", edgeType: "PREREQUISITE", weight: 1 },
  { from: "kinematics", to: "acceleration", edgeType: "PREREQUISITE", weight: 1 },
  { from: "position", to: "velocity", edgeType: "PREREQUISITE", weight: 1.2 },
  { from: "velocity", to: "acceleration", edgeType: "PREREQUISITE", weight: 1.2 },
  { from: "newton_first", to: "newton_second", edgeType: "PREREQUISITE", weight: 1 },
  { from: "newton_second", to: "newton_third", edgeType: "RELATES", weight: 0.9 },
  { from: "newton_second", to: "kinematics", edgeType: "RELATES", weight: 1 },
  { from: "newton_second", to: "friction", edgeType: "RELATES", weight: 0.9 },
  { from: "newton_second", to: "projectile_motion", edgeType: "RELATES", weight: 1 },
  { from: "newton_second", to: "circular_motion", edgeType: "RELATES", weight: 1 },
  { from: "newton_second", to: "momentum", edgeType: "RELATES", weight: 1 },
  { from: "kinematics", to: "projectile_motion", edgeType: "PREREQUISITE", weight: 1.1 },
  { from: "kinematics", to: "circular_motion", edgeType: "PREREQUISITE", weight: 1.1 },
  { from: "newton_second", to: "energy_basics", edgeType: "RELATES", weight: 0.9 },
  { from: "momentum", to: "newton_second", edgeType: "RELATES", weight: 0.9 },
  { from: "friction", to: "newton_second", edgeType: "PREREQUISITE", weight: 0.9 },
  { from: "energy_basics", to: "newton_second", edgeType: "RELATES", weight: 0.8 },
];

// grammar_label + surface_form_family -> misconception target
const MISCONCEPTION_TARGETS: Array<{ conceptExternalId: string; grammarLabel: string; surfaceFormFamily: string; description?: string }> = [
  { conceptExternalId: "newton_first", grammarLabel: "force_implies_motion", surfaceFormFamily: "direct_question", description: "Belief that force is needed to maintain motion" },
  { conceptExternalId: "newton_first", grammarLabel: "force_implies_motion", surfaceFormFamily: "scenario_based" },
  { conceptExternalId: "newton_first", grammarLabel: "velocity_implies_force", surfaceFormFamily: "direct_question", description: "Belief that motion implies a force in direction of motion" },
  { conceptExternalId: "newton_third", grammarLabel: "action_reaction_cancel", surfaceFormFamily: "direct_question", description: "Belief that action-reaction cancel so no motion" },
  { conceptExternalId: "newton_third", grammarLabel: "action_reaction_cancel", surfaceFormFamily: "scenario_based" },
  { conceptExternalId: "friction", grammarLabel: "friction_direction", surfaceFormFamily: "direct_question", description: "Wrong direction of friction" },
  { conceptExternalId: "newton_second", grammarLabel: "n2_mass_inverse", surfaceFormFamily: "direct_question", description: "Confusion about F=ma and mass" },
  { conceptExternalId: "projectile_motion", grammarLabel: "projectile_no_force_horizontal", surfaceFormFamily: "direct_question", description: "Belief in horizontal force after release" },
  { conceptExternalId: "circular_motion", grammarLabel: "centripetal_direction", surfaceFormFamily: "direct_question", description: "Confusion about direction when string breaks" },
  { conceptExternalId: "energy_basics", grammarLabel: "work_sign", surfaceFormFamily: "direct_question", description: "Sign of work when slowing object" },
  { conceptExternalId: "momentum", grammarLabel: "momentum_conservation_isolated", surfaceFormFamily: "direct_question", description: "When momentum is conserved" },
];

async function main() {
  const configPayload = {
    version: 1,
    gatingMinObservations: 3,
    gatingMatchStrengthThreshold: 0.7,
    confidenceHalfLifeDays: 14,
    schedulerProbeRatioCap: 0.33,
    schedulerMinMinutesBetween: 2,
  };
  let config = await prisma.configVersion.findUnique({ where: { version: 1 } });
  if (!config) {
    config = await prisma.configVersion.create({ data: configPayload });
  }
  console.log("ConfigVersion:", config.version);

  const conceptIds = new Map<string, string>();
  for (const c of CONCEPTS) {
    const created = await prisma.concept.upsert({
      where: { externalId: c.externalId },
      create: { externalId: c.externalId, name: c.name, description: c.description ?? null },
      update: { name: c.name, description: c.description ?? null },
    });
    conceptIds.set(c.externalId, created.id);
  }
  console.log("Concepts:", conceptIds.size);

  for (const e of EDGES) {
    const fromId = conceptIds.get(e.from);
    const toId = conceptIds.get(e.to);
    if (!fromId || !toId) continue;
    await prisma.conceptEdge.upsert({
      where: {
        fromConceptId_toConceptId_edgeType: { fromConceptId: fromId, toConceptId: toId, edgeType: e.edgeType },
      },
      create: {
        fromConceptId: fromId,
        toConceptId: toId,
        edgeType: e.edgeType,
        proximityWeight: e.weight,
        source: "SEEDED",
      },
      update: { proximityWeight: e.weight },
    });
  }
  console.log("ConceptEdges:", EDGES.length);

  for (const t of MISCONCEPTION_TARGETS) {
    const conceptId = conceptIds.get(t.conceptExternalId);
    if (!conceptId) continue;
    await prisma.misconceptionTarget.upsert({
      where: {
        conceptId_grammarLabel_surfaceFormFamily: {
          conceptId,
          grammarLabel: t.grammarLabel,
          surfaceFormFamily: t.surfaceFormFamily,
        },
      },
      create: {
        conceptId,
        grammarLabel: t.grammarLabel,
        surfaceFormFamily: t.surfaceFormFamily,
        description: t.description ?? null,
      },
      update: { description: t.description ?? null },
    });
  }
  console.log("MisconceptionTargets:", MISCONCEPTION_TARGETS.length);
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
