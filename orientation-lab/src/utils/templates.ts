import type { OrientationState } from "../types/orientation";
import { defaultOrientationState } from "./defaultState";
import { createId } from "./id";

export type TemplateId =
  | "blank"
  | "service-pressure"
  | "program-delivery"
  | "safety-critical"
  | "public-service";

export type Template = {
  id: TemplateId;
  name: string;
  description: string;
  seed: OrientationState;
};

function withSeedBase(): OrientationState {
  return {
    ...defaultOrientationState,
    // keep whatever default property names your Block 1 uses
  };
}

export const TEMPLATES: Template[] = [
  {
    id: "blank",
    name: "Blank",
    description: "Start from scratch.",
    seed: withSeedBase(),
  },
  {
    id: "service-pressure",
    name: "Service under pressure",
    description: "Demand/capacity/time collide (health, care, public services).",
    seed: {
      ...withSeedBase(),
      models: [
        {
          id: createId("model"),
          name: "Ops view",
          claim: "The system is saturating during a predictable window; queues cascade after that.",
          scope: "Throughput, queues, capacity constraints; not clinical quality or long-term demand change.",
        },
        {
          id: createId("model"),
          name: "Safety view",
          claim: "Risk increases when waits breach the service threshold; mitigation is about protecting the edge cases.",
          scope: "Safety and escalation; not staffing rosters or blame assignment.",
        },
      ],
      assumptions: [
        {
          id: createId("assumption"),
          text: "The main bottleneck is effective capacity (not raw demand).",
          status: "contested",
          owner: "Service lead / ops manager",
        },
        {
          id: createId("assumption"),
          text: "A small capacity change can have non-linear effects when the system is near saturation.",
          status: "given",
          owner: "Ops / improvement lead",
        },
      ],
      disagreements: [
        {
          id: createId("disagreement"),
          topic: "Is the primary issue demand variability or throughput capacity?",
          parties: "Ops vs frontline vs leadership",
          whatWouldChangeMind: "Time-windowed evidence on arrivals vs starts/completions; clear bottleneck narrative.",
        },
      ],
      unknowns: [
        {
          id: createId("unknown"),
          question: "Which part of the pathway is the true constraint during the peak window?",
          impact: "high",
          horizon: "days",
          owner: "Ops / data analyst",
        },
      ],
      judgments: ["measurement", "threshold", "tradeoff", "authority"],
    },
  },
  {
    id: "program-delivery",
    name: "Program delivery (innovation)",
    description: "Complex programme with competing success definitions.",
    seed: {
      ...withSeedBase(),
      models: [
        {
          id: createId("model"),
          name: "Delivery view",
          claim: "We can ship if we narrow scope and protect the critical path.",
          scope: "Roadmap, dependencies, delivery constraints; not market strategy.",
        },
        {
          id: createId("model"),
          name: "Value view",
          claim: "Shipping the wrong thing creates irreversible cost; we must validate assumptions first.",
          scope: "Value/risk; not day-to-day delivery tactics.",
        },
      ],
      assumptions: [
        {
          id: createId("assumption"),
          text: "The critical path is known and stable for the next 4–6 weeks.",
          status: "unknown",
          owner: "Program lead",
        },
      ],
      disagreements: [
        {
          id: createId("disagreement"),
          topic: "Do we prioritise speed (ship) or certainty (validate) this month?",
          parties: "Delivery vs product vs sponsor",
          whatWouldChangeMind: "Clear definition of irreversible decisions + evidence needed for confidence.",
        },
      ],
      unknowns: [
        {
          id: createId("unknown"),
          question: "Which assumptions, if wrong, would invalidate the plan?",
          impact: "high",
          horizon: "days",
          owner: "Program lead / sponsor",
        },
      ],
      judgments: ["definition", "tradeoff", "authority", "timing", "values"],
    },
  },
  {
    id: "safety-critical",
    name: "Safety-critical engineering",
    description: "Aerospace, robotics, critical infrastructure.",
    seed: {
      ...withSeedBase(),
      models: [
        {
          id: createId("model"),
          name: "Safety case view",
          claim: "The system is safe if constraints are enforced and failure modes are bounded.",
          scope: "Hazards, constraints, assurance artefacts; not schedule pressure.",
        },
        {
          id: createId("model"),
          name: "Delivery pressure view",
          claim: "We're taking on risk implicitly to hit milestones; that risk must be surfaced and owned.",
          scope: "Delivery constraints; not rewriting the safety case.",
        },
      ],
      assumptions: [
        {
          id: createId("assumption"),
          text: "We know the top hazards and have credible mitigations.",
          status: "contested",
          owner: "Safety / assurance lead",
        },
      ],
      disagreements: [
        {
          id: createId("disagreement"),
          topic: "Is the current mitigation plan adequate for the highest-impact hazards?",
          parties: "Engineering vs safety vs leadership",
          whatWouldChangeMind: "Evidence that mitigations hold under stress; explicit residual risk acceptance.",
        },
      ],
      unknowns: [
        {
          id: createId("unknown"),
          question: "Which hazard scenarios remain untested under realistic stress conditions?",
          impact: "high",
          horizon: "weeks",
          owner: "Test / safety lead",
        },
      ],
      judgments: ["measurement", "threshold", "authority", "timing", "values"],
    },
  },
  {
    id: "public-service",
    name: "Public services (local government)",
    description: "High demand, constrained resources, public accountability.",
    seed: {
      ...withSeedBase(),
      models: [
        {
          id: createId("model"),
          name: "Demand view",
          claim: "Need is rising faster than resources; prioritisation is unavoidable.",
          scope: "Need/prioritisation; not workforce planning detail.",
        },
        {
          id: createId("model"),
          name: "Equity view",
          claim: "How we ration services matters as much as how much we ration.",
          scope: "Fairness and harms; not service throughput mechanics.",
        },
      ],
      assumptions: [
        {
          id: createId("assumption"),
          text: "Current thresholds reflect policy intent (not drift).",
          status: "contested",
          owner: "Service director / policy lead",
        },
      ],
      disagreements: [
        {
          id: createId("disagreement"),
          topic: "Are we drifting into implicit rationing without governance?",
          parties: "Frontline vs leadership vs elected officials",
          whatWouldChangeMind: "Transparent thresholds + explicit ownership of tradeoffs.",
        },
      ],
      unknowns: [
        {
          id: createId("unknown"),
          question: "Where is the hidden backlog and how is harm accumulating?",
          impact: "high",
          horizon: "days",
          owner: "Service lead / analytics",
        },
      ],
      judgments: ["definition", "threshold", "tradeoff", "authority", "values"],
    },
  },
];

export function getTemplate(id: TemplateId): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

