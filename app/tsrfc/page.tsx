"use client";

import { useState } from "react";

type FailureSurfaces = {
  technical: number;
  workflow: number;
  economic: number;
  evidence: number;
  adoption: number;
};

type Concept = {
  id: string;
  name: string;
  summary: string;
  domain: string;
  procedureLabel: string;
  unitOpsMapped: number;
  unitOpsTotal: number;
  evidenceStrength: number; // relative, within-context
  riskTechnical: number;
  riskWorkflow: number;
  riskEconomic: number;
  riskAdoption: number;
  failureSurfaces: FailureSurfaces;
  notes?: string;
};

type Scenario = {
  id: string;
  label: string;
  domain: string;
  indication: string;
  contextNotes?: string;
  standardOfCare: Concept;
  concepts: {
    A: Concept;
    B: Concept;
  };
};

type ScenarioKey = "spine_mis_l4_l5" | "endo_colonoscopy_ai";

const scenarios: Record<ScenarioKey, Scenario> = {
  // Future personas for stress-testing (not implemented):
  // - Primary straightforward
  // - High BMI
  // - Revision surgery
  // - Elderly multi-morbid
  spine_mis_l4_l5: {
    id: "spine_mis_l4_l5",
    label: "Spine – MIS L4/5 Lumbar Decompression",
    domain: "Spine surgery",
    indication: "Lumbar spinal stenosis L4/5 (elective MIS corridor)",
    contextNotes:
      "Illustrative values only. Outcomes, patient modifiers and local data intentionally omitted in this prototype.",
    standardOfCare: {
      id: "soc_mis_l4_l5",
      name: "Current MIS Lumbar Decompression",
      summary:
        "Standard navigated/unassisted MIS decompression using tubular retractor and conventional instruments.",
      domain: "Spine",
      procedureLabel: "MIS lumbar decompression (L4/5)",
      unitOpsMapped: 9,
      unitOpsTotal: 9,
      evidenceStrength: 1.1,
      riskTechnical: 2.8,
      riskWorkflow: 1.0,
      riskEconomic: 0.8,
      riskAdoption: 0.7,
      failureSurfaces: {
        technical: 2.8,
        workflow: 1.0,
        economic: 0.8,
        evidence: 0.3,
        adoption: 0.7,
      },
      notes:
        "Anchored on current best practice in an experienced MIS unit. Values illustrative, not calibrated.",
    },
    concepts: {
      A: {
        id: "guided_sleeve",
        name: "Guided Decompression Sleeve",
        summary:
          "Navigation-assisted decompression aid within MIS corridor, bounded resection envelope and depth cues.",
        domain: "Spine",
        procedureLabel: "MIS lumbar decompression (L4/5)",
        unitOpsMapped: 9,
        unitOpsTotal: 9,
        evidenceStrength: 1.0,
        riskTechnical: 2.5,
        riskWorkflow: 1.0,
        riskEconomic: 0.5,
        riskAdoption: 0.5,
        failureSurfaces: {
          technical: 2.5,
          workflow: 1.0,
          economic: 0.5,
          evidence: 0.0,
          adoption: 0.5,
        },
        notes:
          "Reduces freehand variation, introduces dependency on guidance stack and device-specific learning curve.",
      },
      B: {
        id: "robotic_mis_platform",
        name: "Robotic MIS Platform",
        summary:
          "Robotic-assisted docking and decompression platform integrated with navigation and custom instruments.",
        domain: "Spine",
        procedureLabel: "MIS lumbar decompression (L4/5)",
        unitOpsMapped: 9,
        unitOpsTotal: 9,
        evidenceStrength: 0.8,
        riskTechnical: 2.0,
        riskWorkflow: 2.0,
        riskEconomic: 2.0,
        riskAdoption: 1.0,
        failureSurfaces: {
          technical: 2.0,
          workflow: 2.0,
          economic: 2.0,
          evidence: 0.2,
          adoption: 1.0,
        },
        notes:
          "Improves ergonomics and reproducibility but adds capital cost, setup time, and additional team training in early adoption phases.",
      },
    },
  },
  endo_colonoscopy_ai: {
    id: "endo_colonoscopy_ai",
    label: "Endoscopy – Colonoscopy + AI Assist",
    domain: "Endoscopy",
    indication: "Bowel cancer screening colonoscopy",
    contextNotes:
      "Illustrative values only. Based on generic assumptions about AI-assisted screening vs current practice.",
    standardOfCare: {
      id: "soc_colonoscopy",
      name: "Standard Colonoscopy",
      summary:
        "Conventional colonoscopy with current bowel prep, inspection protocol and withdrawal times.",
      domain: "Endoscopy",
      procedureLabel: "Colonoscopy (screening)",
      unitOpsMapped: 6,
      unitOpsTotal: 6,
      evidenceStrength: 1.2,
      riskTechnical: 1.0,
      riskWorkflow: 0.5,
      riskEconomic: 0.3,
      riskAdoption: 0.5,
      failureSurfaces: {
        technical: 1.0,
        workflow: 0.5,
        economic: 0.3,
        evidence: 0.0,
        adoption: 0.5,
      },
      notes:
        "Anchored on contemporary screening practice in high-volume centres.",
    },
    concepts: {
      A: {
        id: "standard_colonoscopy",
        name: "Standard Colonoscopy (reference)",
        summary:
          "Baseline practice reference repeated here for direct comparison in this view.",
        domain: "Endoscopy",
        procedureLabel: "Colonoscopy (screening)",
        unitOpsMapped: 6,
        unitOpsTotal: 6,
        evidenceStrength: 1.2,
        riskTechnical: 1.0,
        riskWorkflow: 0.5,
        riskEconomic: 0.3,
        riskAdoption: 0.5,
        failureSurfaces: {
          technical: 1.0,
          workflow: 0.5,
          economic: 0.3,
          evidence: 0.0,
          adoption: 0.5,
        },
        notes: "Deliberately mirrors the standard-of-care values.",
      },
      B: {
        id: "ai_polyp_overlay",
        name: "AI Polyp Detection Overlay",
        summary:
          "Real-time AI overlay for polyp detection and highlighting on endoscopy video.",
        domain: "Endoscopy",
        procedureLabel: "Colonoscopy (screening)",
        unitOpsMapped: 6,
        unitOpsTotal: 6,
        evidenceStrength: 1.4,
        riskTechnical: 1.2,
        riskWorkflow: 0.8,
        riskEconomic: 0.7,
        riskAdoption: 0.6,
        failureSurfaces: {
          technical: 1.2,
          workflow: 0.8,
          economic: 0.7,
          evidence: 0.4,
          adoption: 0.6,
        },
        notes:
          "Potential uplift in adenoma detection; introduces alert fatigue, integration and maintenance considerations.",
      },
    },
  },
};

function compositeTranslationalFriction(concept: Concept): number {
  return (
    concept.riskTechnical +
    concept.riskWorkflow +
    concept.riskEconomic +
    concept.riskAdoption
  );
}

type Band = {
  label: "GO" | "CAUTIOUS" | "NO-GO";
  description: string;
  color: string;
};

function interpretiveBand(total: number): Band {
  if (total <= 4) {
    return {
      label: "GO",
      description:
        "Lower composite translational friction in this procedural context.",
      color: "#198038",
    };
  }
  if (total <= 7) {
    return {
      label: "CAUTIOUS",
      description:
        "Moderate friction – would usually warrant structured introduction and monitoring.",
      color: "#BF8700",
    };
  }
  return {
    label: "NO-GO",
      description:
        "Higher composite friction – likely requires redesign or formal study environment.",
    color: "#DA1E28",
  };
}

function riskColor(score: number): string {
  if (score >= 7) return "#DA1E28"; // high
  if (score >= 4) return "#BF8700"; // medium
  return "#198038"; // low
}

function failureCellStyle(score: number): {
  backgroundColor: string;
  borderColor: string;
  color: string;
} {
  if (score >= 9) {
    return {
      backgroundColor: "rgba(218,30,40,0.16)",
      borderColor: "rgba(218,30,40,0.45)",
      color: "#7F1D1D",
    };
  }
  if (score >= 7) {
    return {
      backgroundColor: "rgba(227,98,9,0.16)",
      borderColor: "rgba(227,98,9,0.45)",
      color: "#78350F",
    };
  }
  if (score >= 4) {
    return {
      backgroundColor: "rgba(106,112,117,0.10)",
      borderColor: "rgba(106,112,117,0.30)",
      color: "#111827",
    };
  }
  return {
    backgroundColor: "rgba(25,128,56,0.10)",
    borderColor: "rgba(25,128,56,0.25)",
    color: "#14532D",
  };
}

function RiskIndicator({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  const dots = Array.from({ length: 10 }, (_, i) => {
    const threshold = i + 1;
    const filled = score >= threshold;
    return (
      <span
        key={i}
        style={{
          display: "inline-block",
          width: 8,
          height: 8,
          borderRadius: "50%",
          marginRight: 3,
          backgroundColor: filled ? riskColor(score) : "transparent",
          border: `1px solid ${
            filled ? riskColor(score) : "rgba(209,213,219,1)"
          }`,
        }}
      />
    );
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 4,
      }}
    >
      <span
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "#374151",
          minWidth: 90,
        }}
      >
        {label}
      </span>
      <span style={{ flex: 1 }}>{dots}</span>
      <span
        style={{
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          fontSize: 13,
          fontWeight: 500,
          color: "#111827",
          width: 40,
          textAlign: "right",
        }}
      >
        {score.toFixed(1)}
      </span>
    </div>
  );
}

function FailureHeatmap({ concept }: { concept: Concept }) {
  const cells = [
    { key: "technical", label: "T", description: "Technical surface" },
    { key: "workflow", label: "W", description: "Workflow surface" },
    { key: "economic", label: "E", description: "Economic surface" },
    { key: "evidence", label: "Ev", description: "Evidence gap surface" },
    { key: "adoption", label: "Ad", description: "Adoption surface" },
  ] as const;

  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "#6B7280",
          marginBottom: 6,
        }}
      >
        Failure surfaces (illustrative)
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(0,1fr))",
          gap: 6,
        }}
      >
        {cells.map((cell) => {
          const score =
            concept.failureSurfaces[cell.key as keyof FailureSurfaces];
          const style = failureCellStyle(score);
          return (
            <div
              key={cell.key}
              title={`${cell.description}: ${score.toFixed(1)} (0–10, context-relative)`}
              style={{
                padding: "6px 4px",
                borderRadius: 4,
                border: `1px solid ${style.borderColor}`,
                backgroundColor: style.backgroundColor,
                textAlign: "center",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#6B7280",
                  marginBottom: 2,
                }}
              >
                {cell.label}
              </div>
              <div
                style={{
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  fontSize: 13,
                  fontWeight: 500,
                  color: style.color,
                }}
              >
                {score.toFixed(1)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConceptCard({
  concept,
  roleLabel,
}: {
  concept: Concept;
  roleLabel: string;
}) {
  const total = compositeTranslationalFriction(concept);
  const band = interpretiveBand(total);

  return (
    <section
      aria-label={concept.name}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 6,
        border: "1px solid #D0D7DE",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
          borderLeft: `4px solid ${band.color}`,
          backgroundColor: "rgba(0,0,0,0.01)",
          padding: "8px 10px",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#111827",
            marginBottom: 2,
          }}
        >
          Interpretive band (prototype): {band.label}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#4B5563",
            lineHeight: 1.4,
          }}
        >
          {band.description}
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#6B7280",
            marginBottom: 2,
          }}
        >
          {roleLabel}
        </div>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#111827",
            margin: 0,
          }}
        >
          {concept.name}
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "#374151",
            marginTop: 4,
            marginBottom: 6,
          }}
        >
          {concept.summary}
        </p>
        <p
          style={{
            fontSize: 12,
            color: "#6B7280",
            marginTop: 0,
          }}
        >
          {concept.domain} · {concept.procedureLabel}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
          gap: 8,
        }}
      >
        <div
          style={{
            backgroundColor: "#F9FAFB",
            padding: 10,
            borderRadius: 4,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#6B7280",
              marginBottom: 4,
            }}
          >
            Unit operations
          </div>
          <div
            style={{
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: 15,
              fontWeight: 600,
              color: "#111827",
            }}
          >
            {concept.unitOpsMapped}/{concept.unitOpsTotal}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#6B7280",
              marginTop: 2,
            }}
          >
            Steps explicitly touched in the pathway.
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#F9FAFB",
            padding: 10,
            borderRadius: 4,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#6B7280",
              marginBottom: 4,
            }}
          >
            Evidence strength
          </div>
          <div
            style={{
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: 15,
              fontWeight: 600,
              color: "#111827",
            }}
          >
            {concept.evidenceStrength.toFixed(1)}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#6B7280",
              marginTop: 2,
            }}
          >
            Relative within this scenario. Values are illustrative and not a clinical decision aid.
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#F9FAFB",
            padding: 10,
            borderRadius: 4,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#6B7280",
              marginBottom: 4,
            }}
          >
            Composite translational friction
          </div>
          <div
            style={{
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: 15,
              fontWeight: 600,
              color: "#111827",
            }}
          >
            {total.toFixed(1)}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#6B7280",
              marginTop: 2,
            }}
          >
            Sum of technical, workflow, economic and adoption surfaces.
          </div>
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#6B7280",
            marginBottom: 6,
          }}
        >
          Risk breakdown (0–10, context-relative)
        </div>
        <RiskIndicator label="Technical" score={concept.riskTechnical} />
        <RiskIndicator label="Workflow" score={concept.riskWorkflow} />
        <RiskIndicator label="Economic" score={concept.riskEconomic} />
        <RiskIndicator label="Adoption" score={concept.riskAdoption} />
      </div>

      <FailureHeatmap concept={concept} />

      {/* Patient Value Surface (Prototype - not scored) */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "#6B7280",
            marginBottom: 6,
          }}
        >
          Patient Value (prototype — not scored)
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#4B5563",
            lineHeight: 1.6,
            padding: "8px 10px",
            backgroundColor: "#F9FAFB",
            border: "1px solid #E1E4E8",
            borderRadius: 4,
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: "#374151",
              margin: 0,
            }}
          >
            Patient value is considered qualitatively (e.g. LOS, complications, recovery, QoL, preference) and is not scored in this prototype.
          </p>
        </div>
      </div>


      {concept.notes ? (
        <p
          style={{
            fontSize: 11,
            color: "#6B7280",
            marginTop: 4,
          }}
        >
          {concept.notes}
        </p>
      ) : null}
    </section>
  );
}

function DeltaCell({
  dimension,
  a,
  b,
}: {
  dimension: string;
  a: number;
  b: number;
}) {
  const delta = b - a;
  const isRiskDimension =
    dimension !== "Evidence strength"; // evidence is "higher is better"
  const isSignificant = Math.abs(delta) > 0.5;
  let color = "#6B7280";
  let arrow = "";

  if (isSignificant) {
    if (delta > 0) {
      arrow = "↑ ";
      color = isRiskDimension ? "#B45309" : "#15803D";
    } else if (delta < 0) {
      arrow = "↓ ";
      color = isRiskDimension ? "#15803D" : "#B45309";
    }
  }

  return (
    <td
      style={{
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: 13,
        color,
        textAlign: "right",
        padding: "6px 8px",
        whiteSpace: "nowrap",
      }}
    >
      {arrow}
      {delta > 0 ? "+" : ""}
      {delta.toFixed(1)}
    </td>
  );
}

export default function TSRFCPage() {
  const [selectedScenario, setSelectedScenario] =
    useState<ScenarioKey>("spine_mis_l4_l5");

  const scenario = scenarios[selectedScenario];
  const soc = scenario.standardOfCare;
  const conceptA = scenario.concepts.A;
  const conceptB = scenario.concepts.B;

  const totalSoc = compositeTranslationalFriction(soc);
  const totalA = compositeTranslationalFriction(conceptA);
  const totalB = compositeTranslationalFriction(conceptB);

  const bandSoc = interpretiveBand(totalSoc);
  const bandA = interpretiveBand(totalA);
  const bandB = interpretiveBand(totalB);

  const interpretationText = (() => {
    // Check if Concept A mirrors SOC (endoscopy scenario)
    const conceptAMirrorsSOC = 
      Math.abs(totalA - totalSoc) < 0.1 && 
      Math.abs(conceptA.evidenceStrength - soc.evidenceStrength) < 0.1;
    
    if (conceptAMirrorsSOC) {
      // Endoscopy scenario: Concept A IS the baseline
      const deltaB = totalB - totalSoc;
      const evidenceDelta = conceptB.evidenceStrength - soc.evidenceStrength;
      return `Standard colonoscopy defines baseline friction. AI polyp detection overlay adds +${Math.abs(deltaB).toFixed(1)} composite friction, primarily economic and workflow${evidenceDelta > 0 ? ', with modest evidence uplift' : ''}. Trade-off may or may not justify adoption at current maturity.`;
    }
    
    // Simple scaffolded interpretation for other scenarios
    if (totalA < totalB && totalA <= totalSoc) {
      return `${conceptA.name} shows lower composite friction than baseline and ${conceptB.name}. Natural candidate for structured evaluation, assuming outcomes not degraded.`;
    }
    if (totalB < totalA && totalB <= totalSoc) {
      // Check if this is the robotic platform (has ergonomic dividend)
      if (conceptB.id === "robotic_mis_platform") {
        return `${conceptB.name} shows lower technical friction (ergonomic dividend) but higher workflow and economic friction than baseline and ${conceptA.name}. More attractive for complex or high-fatigue cases than routine primaries.`;
      }
      return `${conceptB.name} shows lower composite friction than baseline and ${conceptA.name}. Focus for further work if outcome signal favourable.`;
    }
    if (totalSoc < totalA && totalSoc < totalB) {
      return `Current practice remains lowest friction. Both concepts require study environment and clear rationale to displace current practice.`;
    }
    return `Concepts trade off friction across surfaces. This view makes trade-offs explicit rather than prescribing a decision.`;
  })();

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#F5F6F7",
        padding: "24px 16px 40px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        color: "#111827",
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <header
          style={{
            borderBottom: "1px solid #D0D7DE",
            paddingBottom: 12,
            marginBottom: 12,
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#6B7280",
                marginBottom: 2,
              }}
            >
              TSRFC
            </div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 600,
                margin: 0,
                color: "#111827",
              }}
            >
              Translational Surgical Risk &amp; Feasibility Comparator
            </h1>
            <p
              style={{
                fontSize: 13,
                color: "#4B5563",
                marginTop: 4,
                marginBottom: 0,
              }}
            >
              Compare concepts across technical, workflow, economic, adoption and evidence surfaces. Values illustrative.
            </p>
            <div
              style={{
                display: "inline-block",
                marginTop: 4,
                padding: "2px 8px",
                borderRadius: 9999,
                fontSize: 11,
                color: "#374151",
                backgroundColor: "#F3F4F6",
                border: "1px solid #E5E7EB",
              }}
            >
              Prototype view — not a clinical decision aid
            </div>
          </div>
        </header>

        {/* Context strip */}
        <section
          style={{
            backgroundColor: "#FAFBFC",
            borderRadius: 6,
            border: "1px solid #E1E4E8",
            padding: 10,
            marginBottom: 12,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#374151",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#6B7280",
                marginRight: 4,
              }}
            >
              Procedure
            </span>
            {scenario.label}
          </div>
          <span style={{ color: "#D1D5DB" }}>•</span>
          <div
            style={{
              fontSize: 12,
              color: "#374151",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#6B7280",
                marginRight: 4,
              }}
            >
              Indication
            </span>
            {scenario.indication}
          </div>
          {scenario.contextNotes && (
            <>
              <span style={{ color: "#D1D5DB" }}>•</span>
              <div
                style={{
                  fontSize: 11,
                  color: "#6B7280",
                }}
              >
                {scenario.contextNotes}
              </div>
            </>
          )}
        </section>

        {/* Scenario switcher */}
        <section
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 16,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#4B5563",
              maxWidth: 520,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#6B7280",
                marginBottom: 4,
              }}
            >
              Purpose
            </div>
            <p
              style={{
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Compare two concepts against current practice across translational friction surfaces. Supports discussion; does not replace outcome data or clinical judgement.
            </p>
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#4B5563",
              minWidth: 260,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#6B7280",
                marginBottom: 4,
              }}
            >
              Scenario
            </div>
            <div
              style={{
                display: "inline-flex",
                borderRadius: 999,
                border: "1px solid #D0D7DE",
                overflow: "hidden",
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedScenario("spine_mis_l4_l5")}
                style={{
                  padding: "6px 10px",
                  fontSize: 12,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor:
                    selectedScenario === "spine_mis_l4_l5"
                      ? "#E5F0FF"
                      : "#FFFFFF",
                  color:
                    selectedScenario === "spine_mis_l4_l5"
                      ? "#0B4F9A"
                      : "#374151",
                }}
              >
                Spine – MIS L4/5
              </button>
              <button
                type="button"
                onClick={() => setSelectedScenario("endo_colonoscopy_ai")}
                style={{
                  padding: "6px 10px",
                  fontSize: 12,
                  border: "none",
                  cursor: "pointer",
                  borderLeft: "1px solid #D0D7DE",
                  backgroundColor:
                    selectedScenario === "endo_colonoscopy_ai"
                      ? "#E5F0FF"
                      : "#FFFFFF",
                  color:
                    selectedScenario === "endo_colonoscopy_ai"
                      ? "#0B4F9A"
                      : "#374151",
                }}
              >
                Endoscopy – Colonoscopy + AI
              </button>
            </div>
          </div>
        </section>

        {/* Baseline card */}
        <section
          aria-label="Standard of care baseline"
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 6,
            border: "1px solid #E1E4E8",
            padding: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#6B7280",
                  marginBottom: 4,
                }}
              >
                Current practice
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                {soc.name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#4B5563",
                  marginTop: 2,
                }}
              >
                {soc.procedureLabel}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#6B7280",
                    marginBottom: 2,
                  }}
                >
                  Composite friction
                </div>
                <div
                  style={{
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {totalSoc.toFixed(1)}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#6B7280",
                    marginBottom: 2,
                  }}
                >
                  Interpretive band (prototype)
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: bandSoc.color,
                  }}
                >
                  {bandSoc.label}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#6B7280",
                    marginBottom: 2,
                  }}
                >
                  Evidence strength
                </div>
                <div
                  style={{
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {soc.evidenceStrength.toFixed(1)}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "#6B7280",
                    marginTop: 2,
                    maxWidth: 180,
                  }}
                >
                  Relative within this scenario. Values are illustrative and not a clinical decision aid.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Concept cards */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <ConceptCard concept={conceptA} roleLabel="Concept A" />
          <ConceptCard concept={conceptB} roleLabel="Concept B" />
        </section>

        {/* Comparative analysis */}
        <section
          aria-label="Comparative analysis"
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 6,
            border: "1px solid #D0D7DE",
            padding: 12,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#6B7280",
              marginBottom: 8,
            }}
          >
            Comparison
          </div>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "#F3F4F6",
                    borderBottom: "1px solid #D1D5DB",
                  }}
                >
                  <th
                    style={{
                      textAlign: "left",
                      padding: "6px 8px",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#6B7280",
                      fontWeight: 600,
                    }}
                  >
                    Dimension
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "6px 8px",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#6B7280",
                      fontWeight: 600,
                    }}
                  >
                    Standard of care
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "6px 8px",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#6B7280",
                      fontWeight: 600,
                    }}
                  >
                    Concept A
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "6px 8px",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#6B7280",
                      fontWeight: 600,
                    }}
                  >
                    Concept B
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "6px 8px",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#6B7280",
                      fontWeight: 600,
                    }}
                  >
                    Δ A vs SOC
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "6px 8px",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#6B7280",
                      fontWeight: 600,
                    }}
                  >
                    Δ B vs SOC
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    label: "Technical friction",
                    soc: soc.riskTechnical,
                    a: conceptA.riskTechnical,
                    b: conceptB.riskTechnical,
                  },
                  {
                    label: "Workflow friction",
                    soc: soc.riskWorkflow,
                    a: conceptA.riskWorkflow,
                    b: conceptB.riskWorkflow,
                  },
                  {
                    label: "Economic friction",
                    soc: soc.riskEconomic,
                    a: conceptA.riskEconomic,
                    b: conceptB.riskEconomic,
                  },
                  {
                    label: "Adoption friction",
                    soc: soc.riskAdoption,
                    a: conceptA.riskAdoption,
                    b: conceptB.riskAdoption,
                  },
                  {
                    label: "Evidence strength",
                    soc: soc.evidenceStrength,
                    a: conceptA.evidenceStrength,
                    b: conceptB.evidenceStrength,
                  },
                  {
                    label: "Composite friction",
                    soc: totalSoc,
                    a: totalA,
                    b: totalB,
                  },
                ].map((row) => (
                  <tr
                    key={row.label}
                    style={{
                      borderTop: "1px solid #E5E7EB",
                    }}
                  >
                    <td
                      style={{
                        padding: "6px 8px",
                        color: "#374151",
                      }}
                    >
                      {row.label}
                    </td>
                    <td
                      style={{
                        padding: "6px 8px",
                        textAlign: "right",
                        fontFamily:
                          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        fontSize: 13,
                      }}
                    >
                      {row.soc.toFixed(1)}
                    </td>
                    <td
                      style={{
                        padding: "6px 8px",
                        textAlign: "right",
                        fontFamily:
                          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        fontSize: 13,
                      }}
                    >
                      {row.a.toFixed(1)}
                    </td>
                    <td
                      style={{
                        padding: "6px 8px",
                        textAlign: "right",
                        fontFamily:
                          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        fontSize: 13,
                      }}
                    >
                      {row.b.toFixed(1)}
                    </td>
                    <DeltaCell
                      dimension={row.label}
                      a={row.soc}
                      b={row.a}
                    />
                    <DeltaCell
                      dimension={row.label}
                      a={row.soc}
                      b={row.b}
                    />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(() => {
            // Check if Concept A mirrors SOC
            const conceptAMirrorsSOC = 
              Math.abs(totalA - totalSoc) < 0.1 && 
              Math.abs(conceptA.evidenceStrength - soc.evidenceStrength) < 0.1;
            
            if (conceptAMirrorsSOC) {
              return (
                <div
                  style={{
                    marginTop: 12,
                    padding: "8px 10px",
                    backgroundColor: "#F9FAFB",
                    border: "1px solid #E1E4E8",
                    borderRadius: 4,
                    fontSize: 12,
                    color: "#4B5563",
                  }}
                >
                  <strong>Note:</strong> In this scenario, Concept A mirrors the current standard of care. All deltas are measured relative to this baseline.
                </div>
              );
            }
            return null;
          })()}
        </section>

        {/* Interpretation & methodological notes */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            gap: 16,
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 6,
              border: "1px solid #E1E4E8",
              padding: 12,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#6B7280",
                marginBottom: 6,
              }}
            >
              Decision bands
            </div>
            <dl
              style={{
                margin: 0,
                fontSize: 13,
                color: "#374151",
              }}
            >
              <dt
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  padding: "2px 4px",
                  borderRadius: 3,
                  display: "inline-block",
                  backgroundColor: "rgba(25,128,56,0.10)",
                  color: "#166534",
                  border: "1px solid rgba(25,128,56,0.30)",
                  marginBottom: 2,
                }}
              >
                GO
              </dt>
              <dd style={{ margin: "0 0 8px 0" }}>
                Lower composite friction. Candidate for structured introduction, subject to outcome signal and governance.
              </dd>
              <dt
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  padding: "2px 4px",
                  borderRadius: 3,
                  display: "inline-block",
                  backgroundColor: "rgba(191,135,0,0.10)",
                  color: "#92400E",
                  border: "1px solid rgba(191,135,0,0.30)",
                  marginBottom: 2,
                }}
              >
                Cautious
              </dt>
              <dd style={{ margin: "0 0 8px 0" }}>
                Moderate friction. Requires formal introduction pathway, mitigation plan and monitoring.
              </dd>
              <dt
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  padding: "2px 4px",
                  borderRadius: 3,
                  display: "inline-block",
                  backgroundColor: "rgba(218,30,40,0.10)",
                  color: "#991B1B",
                  border: "1px solid rgba(218,30,40,0.30)",
                  marginBottom: 2,
                }}
              >
                No-go
              </dt>
              <dd style={{ margin: 0 }}>
                High friction. Suggests substantial redesign or study environment rather than routine adoption.
              </dd>
            </dl>
          </div>

          <div
            style={{
              backgroundColor: "#FAFBFC",
              borderRadius: 6,
              border: "1px solid #E1E4E8",
              padding: 12,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#6B7280",
                marginBottom: 8,
              }}
            >
              Methodological notes (prototype)
            </div>
            <p
              style={{
                fontSize: 12,
                color: "#4B5563",
                marginTop: 0,
                marginBottom: 6,
                lineHeight: 1.5,
              }}
            >
              Values shown here are illustrative and scenario-specific, not validated scores.
            </p>
            <p
              style={{
                fontSize: 12,
                color: "#4B5563",
                marginTop: 0,
                marginBottom: 6,
                lineHeight: 1.5,
              }}
            >
              This view is designed to support structured discussion of translational friction (technical, workflow, economic, adoption).
            </p>
            <p
              style={{
                fontSize: 12,
                color: "#4B5563",
                marginTop: 0,
                marginBottom: 0,
                lineHeight: 1.5,
              }}
            >
              It is not a clinical decision support tool and does not model patient-level outcomes.
            </p>
          </div>

          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 6,
              border: "1px solid #E1E4E8",
              padding: 12,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#6B7280",
                marginBottom: 6,
              }}
            >
              Scenario summary
            </div>
            <p
              style={{
                fontSize: 13,
                color: "#111827",
                marginTop: 0,
                marginBottom: 0,
              }}
            >
              {interpretationText}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
