// data/tsrfcExamples.ts

export type RiskScores = {
  coverage_unit_ops: number;
  risk_technical: number;
  risk_workflow: number;
  risk_economic: number;
  evidence_strength: number;
  adoption_risk_load: number;
};

export type UnitOperation = {
  id: string;
  name: string;
  primaryGoal: string;
  typicalIssues: string[];
  innovationHooks: string[];
};

export type FailureSurface = {
  category: "technical" | "workflow" | "economic" | "adoption" | "evidence";
  risk: "low" | "medium" | "high";
  code: string;
  description: string;
  affectedOps: string[];
  notes?: string;
};

export type EvidenceProfile = {
  currentLevel: string;
  targetLevel: string;
  comments?: string;
};

export type AdoptionProfile = {
  trajectory: string;
  primaryBarriers: string[];
  leveragePoints: string[];
  killCriteria: string[];
  notes?: string;
};

export type PatientOutcomes = {
  primaryOutcome: string;
  secondaryOutcomes: string[];
  expectedDeltaVsBaseline: "small" | "moderate" | "large" | "uncertain";
};

export type RegulatoryPathway = {
  classLabel: string;
  region: string;
  anticipatedEvidenceLevel: string;
  regulatoryComplexityScore: 0 | 1 | 2; // low/med/high
};

export type ReimbursementProfile = {
  hasExistingCode: "yes" | "no" | "partial" | "unknown";
  payerAlignment: "aligned" | "misaligned" | "unknown";
  reimbursementRiskScore: 0 | 1 | 2; // low/med/high
};

export type CompetitiveContext = {
  alternatives: string[];
  relativePosition: "behind" | "comparable" | "ahead" | "uncertain";
};

export type TsrfcExample = {
  id: string;
  label: string;
  procedureId: string;
  domain: "spine" | "endoscopy" | "ent";
  indication: string;
  approach: string;
  notes?: string;
  conceptName: string;
  conceptRole: string;
  conceptType: string;
  capitalCostBand: "low" | "medium" | "high";
  disposablesCostBand: "low" | "medium" | "high";
  learningCurveCases: number | null;
  unitOperations: UnitOperation[];
  failureSurfaces: FailureSurface[];
  evidence: EvidenceProfile;
  adoption: AdoptionProfile;
  patientOutcomes: PatientOutcomes;
  regulatory: RegulatoryPathway;
  reimbursement: ReimbursementProfile;
  competitive: CompetitiveContext;
  scores: RiskScores;
};

// shared spine MIS lumbar unit-op ladder
const SPINE_MIS_LUMBAR_UNIT_OPS: UnitOperation[] = [
  {
    id: "spine_mis_lumbar_01",
    name: "Positioning and setup",
    primaryGoal: "Safe prone positioning with appropriate padding and monitoring.",
    typicalIssues: ["pressure areas", "line access", "equipment layout variability"],
    innovationHooks: ["standardised setup bundles", "integrated positioning aids"],
  },
  {
    id: "spine_mis_lumbar_02",
    name: "Imaging and level confirmation",
    primaryGoal: "Confirm correct lumbar level (e.g. L4/5).",
    typicalIssues: ["wrong-level surgery risk", "fluoroscopy time"],
    innovationHooks: ["smarter level confirmation overlays", "reduced radiation techniques"],
  },
  {
    id: "spine_mis_lumbar_03",
    name: "Skin incision and dilator placement",
    primaryGoal: "Create safe corridor to lamina.",
    typicalIssues: ["guidewire control", "radiation exposure"],
    innovationHooks: ["haptic feedback on depth", "visual guidance tools"],
  },
  {
    id: "spine_mis_lumbar_04",
    name: "Tubular retractor docking",
    primaryGoal: "Stable working channel with minimal muscle trauma.",
    typicalIssues: ["docking stability", "line-of-sight limitations"],
    innovationHooks: ["adaptive docking systems", "feedback on placement quality"],
  },
  {
    id: "spine_mis_lumbar_05",
    name: "Ipsilateral decompression",
    primaryGoal: "Remove bone/ligament to decompress ipsilateral nerve root.",
    typicalIssues: ["landmark visibility", "bleeding obscuring field", "neural injury risk"],
    innovationHooks: ["bounded resection zones", "guardrail instruments"],
  },
  {
    id: "spine_mis_lumbar_06",
    name: "Contralateral decompression",
    primaryGoal: "Undercutting to decompress contralateral side.",
    typicalIssues: ["depth perception", "dural tear risk", "under/over-decompression"],
    innovationHooks: ["navigation-assisted safe envelope", "visualisation augmentation"],
  },
  {
    id: "spine_mis_lumbar_07",
    name: "Hemostasis",
    primaryGoal: "Achieve hemostasis and prevent postoperative hematoma.",
    typicalIssues: ["thermal spread", "time-consuming bleeding control"],
    innovationHooks: ["targeted hemostasis tools", "better visualisation under bleed"],
  },
  {
    id: "spine_mis_lumbar_08",
    name: "Closure",
    primaryGoal: "Layered closure with low infection and CSF leak risk.",
    typicalIssues: ["CSF leak detection", "time pressure at end of case"],
    innovationHooks: ["CSF leak detection aids", "ergonomic closure tools"],
  },
  {
    id: "spine_mis_lumbar_09",
    name: "Immediate post-op monitoring",
    primaryGoal: "Monitor neurological status, pain, and early complications.",
    typicalIssues: ["handover quality", "early complication detection"],
    innovationHooks: ["structured post-op checklists", "early warning data capture"],
  },
];

export const TSRFC_EXAMPLES: TsrfcExample[] = [
  // Spine baseline MIS decompression
  {
    id: "spine_baseline",
    label: "Spine – MIS lumbar decompression (guided sleeve)",
    procedureId: "mis_lumbar_decompression",
    domain: "spine",
    indication: "lumbar spinal stenosis L4/5",
    approach: "unilateral laminotomy bilateral decompression",
    notes: "Demo spec for MIS lumbar decompression (L4/5).",
    conceptName: "Guided Decompression Sleeve",
    conceptRole: "resection_assist",
    conceptType: "navigation_assisted_tool",
    capitalCostBand: "medium",
    disposablesCostBand: "medium",
    learningCurveCases: 25,
    unitOperations: SPINE_MIS_LUMBAR_UNIT_OPS,
    failureSurfaces: [
      {
        category: "technical",
        risk: "high",
        code: "DURAL_TEAR_RISK",
        description:
          "Risk of dural tear during decompression (especially undercutting and contralateral work).",
        affectedOps: ["spine_mis_lumbar_05", "spine_mis_lumbar_06"],
        notes: "Any tool that modifies decompression technique must not increase this risk.",
      },
      {
        category: "technical",
        risk: "medium",
        code: "INCOMPLETE_DECOMPRESSION",
        description:
          "Risk of residual stenosis due to under-decompression, leading to persistent symptoms or re-operation.",
        affectedOps: ["spine_mis_lumbar_05", "spine_mis_lumbar_06"],
        notes:
          "Navigation/guardrails that restrict resection envelope may inadvertently cause under-decompression.",
      },
      {
        category: "technical",
        risk: "medium",
        code: "OVER_DECOMPRESSION_INSTABILITY",
        description: "Risk of excessive bone removal leading to segmental instability.",
        affectedOps: ["spine_mis_lumbar_05", "spine_mis_lumbar_06"],
        notes:
          "Guardrails that do not respect bony stabilising structures may increase long-term instability.",
      },
      {
        category: "workflow",
        risk: "medium",
        code: "SETUP_COMPLEXITY",
        description: "Increased OR setup complexity due to navigation stack.",
        affectedOps: ["spine_mis_lumbar_01", "spine_mis_lumbar_02"],
        notes:
          "More devices and steps increase risk of delays, misconfiguration, and cancellations.",
      },
      {
        category: "workflow",
        risk: "medium",
        code: "EQUIPMENT_BURDEN",
        description:
          "Additional navigation equipment in theatre competing for space and attention.",
        affectedOps: [],
        notes:
          "Physical and cognitive clutter can reduce resilience in complex cases.",
      },
      {
        category: "technical",
        risk: "medium",
        code: "NAV_DEPENDENCY",
        description:
          "Dependence on navigation; failure mid-case may leave the surgeon worse off than baseline.",
        affectedOps: ["spine_mis_lumbar_02", "spine_mis_lumbar_05", "spine_mis_lumbar_06"],
        notes:
          "Rescue workflows must exist when navigation is unavailable or inaccurate.",
      },
      {
        category: "adoption",
        risk: "medium",
        code: "LEARNING_CURVE_STEEP",
        description:
          "Steep learning curve; early cases may show worse outcomes than baseline MIS.",
        affectedOps: [],
        notes:
          "Requires structured proctoring, case selection, and transparent outcome monitoring.",
      },
      {
        category: "economic",
        risk: "medium",
        code: "CAPITAL_COST_UNCLEAR_ROI",
        description:
          "Non-trivial capital cost with uncertain return on investment.",
        affectedOps: [],
        notes:
          "Without clear improvements in outcomes, throughput, or staff utilisation, adoption may stall.",
      },
      {
        category: "evidence",
        risk: "low",
        code: "EVIDENCE_GAP_UNKNOWN_BENEFIT",
        description:
          "Evidence gap between claimed benefits and existing data.",
        affectedOps: [],
        notes:
          "Requires at least prospective data collection, ideally multicentre, before broad adoption.",
      },
    ],
    evidence: {
      currentLevel: "retrospective / early prospective",
      targetLevel: "prospective_multicentre",
      comments: "Evidence reasoning not yet fully implemented (v0 heuristic).",
    },
    adoption: {
      trajectory: "uncertain_but_plausible",
      primaryBarriers: ["learning curve", "capital cost", "setup complexity"],
      leveragePoints: [
        "structured proctoring",
        "early outcome tracking vs MIS baseline",
      ],
      killCriteria: [
        "no benefit vs MIS on key outcomes",
        "higher complication rates early in adoption",
      ],
      notes: "Adoption dynamics are currently heuristic and illustrative.",
    },
    patientOutcomes: {
      primaryOutcome: "leg pain reduction / neurogenic claudication relief",
      secondaryOutcomes: [
        "reoperation rate",
        "segmental stability",
        "return-to-work time",
      ],
      expectedDeltaVsBaseline: "moderate",
    },
    regulatory: {
      classLabel: "Class IIb device (tool + navigation assist)",
      region: "UK/EU/US (conceptual)",
      anticipatedEvidenceLevel: "prospective single-centre then multicentre comparisons",
      regulatoryComplexityScore: 1,
    },
    reimbursement: {
      hasExistingCode: "yes",
      payerAlignment: "aligned",
      reimbursementRiskScore: 1,
    },
    competitive: {
      alternatives: [
        "Standard MIS decompression with fluoroscopy",
        "Navigation-assisted decompression without guardrails",
      ],
      relativePosition: "comparable",
    },
    scores: {
      coverage_unit_ops: 9.0,
      risk_technical: 2.5,
      risk_workflow: 1.0,
      risk_economic: 0.5,
      evidence_strength: 0.5,
      adoption_risk_load: 0.5,
    },
  },

  // Spine robotic variant
  {
    id: "spine_robotic",
    label: "Spine – MIS lumbar decompression (robotic)",
    procedureId: "mis_lumbar_decompression",
    domain: "spine",
    indication: "lumbar spinal stenosis L4/5",
    approach: "unilateral laminotomy bilateral decompression",
    notes: "Concept: robotic/navigation-heavy decompression platform.",
    conceptName: "Robotic MIS Decompression Platform",
    conceptRole: "resection_assist",
    conceptType: "robotic_platform",
    capitalCostBand: "high",
    disposablesCostBand: "medium",
    learningCurveCases: 40,
    unitOperations: SPINE_MIS_LUMBAR_UNIT_OPS,
    failureSurfaces: [
      {
        category: "workflow",
        risk: "high",
        code: "SETUP_COMPLEXITY_ROBOTIC",
        description:
          "High setup complexity due to full robotic stack (robot, navigation, integration).",
        affectedOps: ["spine_mis_lumbar_01", "spine_mis_lumbar_02"],
        notes:
          "Longer setup times, risk of delays and cancellations in high-throughput lists.",
      },
      {
        category: "workflow",
        risk: "medium",
        code: "EQUIPMENT_BURDEN_ROBOTIC",
        description:
          "Additional equipment footprint in OR (robot base, tower, cables).",
        affectedOps: [],
        notes:
          "Reduces flexibility in theatre layout and may clash with anaesthetic needs.",
      },
      {
        category: "economic",
        risk: "high",
        code: "CAPITAL_COST_HIGH_ROI_UNCERTAIN",
        description:
          "High capital cost with uncertain incremental benefit over MIS baseline.",
        affectedOps: [],
        notes:
          "Requires strong evidence of improved outcomes, throughput, or staff utilisation.",
      },
      {
        category: "adoption",
        risk: "high",
        code: "LEARNING_CURVE_VERY_STEEP",
        description:
          "Long learning curve with risk of early performance dip vs baseline MIS.",
        affectedOps: [],
        notes:
          "Needs robust training, proctoring, and patient selection strategy.",
      },
      {
        category: "evidence",
        risk: "medium",
        code: "TRIAL_COMPLEXITY",
        description:
          "Complexity of designing trials that cleanly compare robotic vs MIS baseline.",
        affectedOps: [],
        notes:
          "Randomisation, surgeon expertise, and centre selection all matter.",
      },
    ],
    evidence: {
      currentLevel: "conceptual / early single-centre",
      targetLevel: "prospective_multicentre_comparison_vs_MIS",
      comments:
        "Would likely require multicentre prospective comparison vs MIS baseline with careful control of expertise bias.",
    },
    adoption: {
      trajectory: "uncertain",
      primaryBarriers: [
        "capital cost",
        "learning curve",
        "workflow disruption",
        "theatre footprint",
      ],
      leveragePoints: [
        "clear, reproducible outcome benefit",
        "OR throughput improvement",
        "staff satisfaction",
      ],
      killCriteria: [
        "no improvement vs MIS on key outcomes",
        "no OR throughput gain",
        "high complication rates in early adoption",
      ],
      notes: "",
    },
    patientOutcomes: {
      primaryOutcome: "similar decompression outcomes vs MIS, potentially smoother workflow",
      secondaryOutcomes: [
        "length of stay",
        "intraoperative blood loss",
        "OR time",
      ],
      expectedDeltaVsBaseline: "uncertain",
    },
    regulatory: {
      classLabel: "Class IIb/III (robotic + navigation stack)",
      region: "UK/EU/US (conceptual)",
      anticipatedEvidenceLevel: "prospective multicentre head-to-head vs MIS baseline",
      regulatoryComplexityScore: 2,
    },
    reimbursement: {
      hasExistingCode: "partial",
      payerAlignment: "misaligned",
      reimbursementRiskScore: 2,
    },
    competitive: {
      alternatives: [
        "MIS decompression with navigation but no robot",
        "Existing robotic guidance platforms",
      ],
      relativePosition: "behind",
    },
    scores: {
      coverage_unit_ops: 9.0,
      risk_technical: 2.0,
      risk_workflow: 2.0,
      risk_economic: 2.0,
      evidence_strength: 0.2,
      adoption_risk_load: 2.0,
    },
  },

  // Endoscopy AI example
  {
    id: "endo_ai",
    label: "Endoscopy – Colonoscopy with AI polyp detection",
    procedureId: "colonoscopy_screening",
    domain: "endoscopy",
    indication: "average-risk colorectal cancer screening",
    approach: "standard flexible colonoscopy",
    notes: "AI overlay highlighting suspected polyps in real time.",
    conceptName: "AI Polyp Detection Overlay",
    conceptRole: "navigation_assist",
    conceptType: "real_time_visual_overlay",
    capitalCostBand: "medium",
    disposablesCostBand: "low",
    learningCurveCases: 10,
    unitOperations: [
      {
        id: "endo_01",
        name: "Insertion to caecum",
        primaryGoal: "Safely navigate colon to caecum.",
        typicalIssues: ["looping", "patient discomfort"],
        innovationHooks: ["loop detection", "torque steering assistance"],
      },
      {
        id: "endo_02",
        name: "Withdrawal and inspection",
        primaryGoal: "Systematic inspection of mucosa.",
        typicalIssues: ["missed lesions", "variable withdrawal time"],
        innovationHooks: ["AI quality metrics", "withdrawal time feedback"],
      },
    ],
    failureSurfaces: [
      {
        category: "technical",
        risk: "medium",
        code: "FALSE_NEGATIVES",
        description:
          "AI misses polyps that a careful endoscopist might have detected.",
        affectedOps: ["endo_02"],
        notes: "Must not reduce vigilance or make operator over-reliant on overlay.",
      },
      {
        category: "technical",
        risk: "low",
        code: "FALSE_POSITIVES",
        description:
          "AI flags benign or normal tissue as suspicious, increasing biopsy rate.",
        affectedOps: ["endo_02"],
        notes: "May increase time and cost; needs control via UI/thresholds.",
      },
      {
        category: "workflow",
        risk: "low",
        code: "DISPLAY_CLUTTER",
        description:
          "Overlay may clutter view or distract operator in complex cases.",
        affectedOps: ["endo_02"],
        notes: "UI design and toggle control important.",
      },
      {
        category: "evidence",
        risk: "medium",
        code: "GENERALISABILITY",
        description:
          "Evidence may come from limited centres/operators; generalisability uncertain.",
        affectedOps: [],
        notes: "Needs diverse populations and operators in evaluation.",
      },
      {
        category: "adoption",
        risk: "medium",
        code: "TRUST_AND_OVERRIDING",
        description:
          "Operator trust in AI suggestions may be variable; misuse possible.",
        affectedOps: [],
        notes: "Training and clear override behaviours are key.",
      },
    ],
    evidence: {
      currentLevel: "prospective_single_centre",
      targetLevel: "prospective_multicentre_RCT",
      comments:
        "Typical path: single-centre → multicentre RCT with ADR as primary endpoint.",
    },
    adoption: {
      trajectory: "likely_if_evidence_strong",
      primaryBarriers: [
        "integration with existing stacks",
        "trust in AI output",
      ],
      leveragePoints: [
        "improved ADR",
        "quality metrics for screening programmes",
      ],
      killCriteria: ["no ADR improvement in real-world deployment"],
      notes: "",
    },
    patientOutcomes: {
      primaryOutcome: "adenoma detection rate (ADR)",
      secondaryOutcomes: [
        "interval cancer rate",
        "procedure time",
        "patient safety",
      ],
      expectedDeltaVsBaseline: "moderate",
    },
    regulatory: {
      classLabel: "SaMD, likely Class IIa/IIb equivalent",
      region: "UK/EU/US (conceptual)",
      anticipatedEvidenceLevel:
        "prospective multicentre data with ADR and safety endpoints",
      regulatoryComplexityScore: 1,
    },
    reimbursement: {
      hasExistingCode: "partial",
      payerAlignment: "unknown",
      reimbursementRiskScore: 1,
    },
    competitive: {
      alternatives: [
        "Standard colonoscopy without AI",
        "Competing AI overlay systems",
      ],
      relativePosition: "ahead",
    },
    scores: {
      coverage_unit_ops: 2.0,
      risk_technical: 1.0,
      risk_workflow: 0.5,
      risk_economic: 0.5,
      evidence_strength: 1.5,
      adoption_risk_load: 1.0,
    },
  },
];
