/**
 * OMEGA Trust Terminal — Deterministic Engine Factories
 *
 * Drop-in replacements for LLM pipeline stages.
 * Each function returns schema-valid output matching the exact
 * structure the real pipeline produces after parse + validate.
 *
 * Usage:
 *   import { deterministicRD, deterministicDEC } from "../utils/deterministic";
 *   const rdStages = deterministicRD(query);
 *   const decStages = deterministicDEC(brief, context);
 *
 * Each returns an array of { id, label, data } objects — same shape
 * as the structured outputs array built during runPipeline.
 */

// ─── R&D Engine ─────────────────────────────────────────────────────

export function deterministicRD(query = "How can soft robotic grippers achieve variable stiffness?") {
  const q = query.substring(0, 80);

  return [
    {
      id: "problem",
      label: "Problem Definition",
      data: {
        title: "Variable Stiffness in Soft Robotic Grippers Without Pneumatic Actuation",
        problem_statement: `Current soft robotic grippers rely on pneumatic actuation to modulate stiffness, creating dependency on bulky compressors and limiting deployment in untethered, field, and surgical scenarios. The core challenge is achieving continuous, reversible stiffness modulation (10:1 ratio) using compact, electrically-driven mechanisms that maintain the compliance advantages of soft materials. Query context: ${q}`,
        domain: "Soft Robotics",
        adjacent_domains: [
          "Smart Materials",
          "Electroactive Polymers",
          "Granular Jamming",
          "Surgical Robotics",
          "Metamaterial Design",
          "Control Theory"
        ],
        known_constraints: [
          "Stiffness modulation must exceed 10:1 ratio for functional grasping across object categories",
          "Response time < 500ms for real-time adaptive grasping",
          "Power consumption < 5W for untethered operation (battery budget)",
          "Operating temperature must stay within 20-45°C for human-proximal and surgical use",
          "Cycle life > 100,000 actuations without mechanical degradation"
        ],
        bottleneck: "No existing mechanism simultaneously achieves high stiffness ratio (>10:1), fast response (<500ms), low power (<5W), and biocompatible operating temperatures. Phase-change materials achieve the ratio but are slow. Electroactive polymers are fast but low ratio. Granular jamming needs vacuum. The constraint is that the four requirements form a mutually exclusive set under current material paradigms.",
        hidden_variables: [
          "Viscoelastic hysteresis in repeated cycling — most papers report single-cycle data",
          "Humidity sensitivity of electroactive polymer performance",
          "Manufacturing variability in layer-by-layer soft actuator fabrication",
          "Thermal crosstalk between adjacent stiffness-modulated segments"
        ],
        success_criteria: "A soft gripper achieving >10:1 stiffness ratio, <500ms response, <5W power, operating at 20-45°C, with >100K cycle life, demonstrated grasping objects from 1g (berry) to 2kg (bottle) without pneumatic supply.",
        frontier_questions: [
          "Can composite architectures combine two mechanisms (e.g. jamming + electrostatic) to break the single-mechanism trade-off?",
          "Is there a metamaterial geometry that converts small electrically-driven strains into large stiffness changes through structural amplification?",
          "Can machine learning predict optimal stiffness trajectories for unknown objects in real-time, reducing the required stiffness ratio?"
        ]
      }
    },
    {
      id: "literature",
      label: "Literature Scan",
      data: {
        known_and_settled: [
          "Granular jamming achieves 10-25:1 stiffness ratio but requires vacuum source (SRC-1)",
          "Low-melting-point alloys (LMPA) achieve >50:1 ratio but transition time is 2-8 seconds (SRC-3)",
          "Dielectric elastomer actuators provide fast response but stiffness ratio limited to 3:1 (SRC-5)"
        ],
        known_and_contested: [
          "Whether magnetorheological approaches can achieve sufficient ratio without prohibitive field strength (SRC-2 vs SRC-6)",
          "Whether layer jamming can match granular jamming ratio in compact form factors (SRC-4)"
        ],
        unknown_but_askable: [
          "Can LMPA transition time be reduced below 500ms through geometry optimization or Joule heating patterns?",
          "What is the theoretical maximum stiffness ratio for electrostatic layer jamming?"
        ],
        unknown_and_not_yet_articulable: [
          "Whether there exists a universal stiffness modulation mechanism analogous to how muscles achieve both compliance and force",
          "How to formally specify the 'right amount' of stiffness for a given grasp without full object models"
        ],
        key_papers: [
          { title: "Granular jamming in soft robotics: a comprehensive review", finding: "Vacuum-driven granular jamming achieves 25:1 stiffness ratio in <200ms but requires tethered vacuum supply (SRC-1)", year: "2023", relevance: "Establishes performance ceiling for jamming approaches", source_ref: "SRC-1" },
          { title: "Magnetorheological elastomers for variable stiffness actuators", finding: "MR elastomers achieve 8:1 ratio with 50ms response but require 0.5T field strength from bulky electromagnets (SRC-2)", year: "2023", relevance: "Fast but field generation is the bottleneck", source_ref: "SRC-2" },
          { title: "Low-melting-point alloy composites for tunable stiffness", finding: "LMPA-silicone composites achieve 50:1 ratio but thermal cycling degrades interface after ~10K cycles (SRC-3)", year: "2024", relevance: "Highest ratio but speed and cycle life are problems", source_ref: "SRC-3" },
          { title: "Electrostatic layer jamming for compact variable stiffness", finding: "Layer jamming with electrostatic activation achieves 6:1 ratio at <5W with no moving parts (SRC-4)", year: "2024", relevance: "Closest to multi-constraint satisfaction but ratio too low", source_ref: "SRC-4" },
          { title: "Dielectric elastomer variable stiffness mechanisms", finding: "DEA-based mechanisms provide continuous stiffness control at 100Hz bandwidth but only 3:1 ratio (SRC-5)", year: "2022", relevance: "Fastest response but insufficient ratio for versatile grasping", source_ref: "SRC-5" }
        ],
        absence_detected: "No published work combines two stiffness mechanisms in a single gripper architecture to achieve complementary performance. All approaches optimize a single mechanism in isolation.",
        state_of_art: "Current best single-mechanism approaches: granular jamming (highest ratio, needs vacuum), LMPA (highest ratio without vacuum, too slow), electrostatic layer jamming (compact, low power, insufficient ratio). No composite mechanism architecture has been demonstrated (SRC-1, SRC-3, SRC-4)."
      }
    },
    {
      id: "hypotheses",
      label: "Hypothesis Generation",
      data: {
        methods_summary: { constraint_flip: 1, dimensional_shift: 1, inversion: 1, collision: 1, absence: 1 },
        hypotheses: [
          {
            id: "H1",
            statement: "If electrostatic layer jamming provides the baseline stiffness modulation and localized LMPA elements provide discrete high-stiffness locks, the composite achieves >10:1 ratio with <500ms response by using LMPA only for the final locking step.",
            mechanism: "Electrostatic jamming handles continuous, fast modulation (3-6:1). LMPA micro-elements at strategic joint locations add discrete stiffness multiplication. Only small LMPA volumes need thermal cycling, reducing transition time from seconds to <200ms.",
            generation_method: "constraint_flip",
            provenance_type: "theoretical",
            provenance_basis: "Combining SRC-4 electrostatic jamming with SRC-3 LMPA in composite architecture",
            novelty: "No prior work combines continuous and discrete stiffness mechanisms in a single soft actuator",
            testable: true,
            falsification: "If LMPA micro-elements cannot transition in <500ms at the volumes needed, or if the interface between jamming layers and LMPA creates stress concentrations that reduce cycle life below 50K",
            confidence: "high"
          },
          {
            id: "H2",
            statement: "If the stiffness modulation problem is reframed as an impedance matching problem from control theory, the required stiffness ratio drops from 10:1 to 4:1 because the controller compensates for the remaining mismatch in real-time.",
            mechanism: "Variable impedance control with real-time tactile feedback reduces mechanical stiffness requirements by providing active compliance. A 4:1 mechanism with 100Hz control bandwidth achieves equivalent grasping performance to a 10:1 mechanism with open-loop control.",
            generation_method: "dimensional_shift",
            provenance_type: "analogical",
            provenance_basis: "Impedance control in industrial robots reduces mechanical compliance requirements by 3-5x",
            novelty: "Reframes the material science problem as a control problem, potentially making existing mechanisms sufficient",
            testable: true,
            falsification: "If grasping fragile objects (berries, eggs) requires stiffness transitions faster than the control loop bandwidth, pure control compensation fails",
            confidence: "medium"
          },
          {
            id: "H3",
            statement: "If we ask 'what guarantees a soft gripper fails?', the answer is: uniform stiffness across the contact surface. Therefore, spatial stiffness gradients — not bulk stiffness ratio — are the actual design variable.",
            mechanism: "Patterned stiffness across the gripper surface (stiff at base, compliant at fingertip) achieves stable grasping with lower absolute stiffness ratio because the gradient provides both structural support and conformability simultaneously.",
            generation_method: "inversion",
            provenance_type: "empirical",
            provenance_basis: "Human fingertips have 100:1 stiffness gradient from bone to skin surface",
            novelty: "Shifts optimization from temporal modulation (changing stiffness over time) to spatial modulation (varying stiffness over surface)",
            testable: true,
            falsification: "If objects requiring full-surface high stiffness (heavy rigid objects) cannot be grasped with gradient designs",
            confidence: "high"
          },
          {
            id: "H4",
            statement: "Metamaterial lattice structures with electrically-triggered bistable elements could achieve >20:1 stiffness ratio through geometric amplification — small strain inputs flip lattice cells between compliant and rigid configurations.",
            mechanism: "Each lattice cell has two stable states with different effective moduli. Piezoelectric or shape-memory triggers flip cells individually. Bulk stiffness is a function of the fraction of cells in each state, providing continuous tunability.",
            generation_method: "collision",
            provenance_type: "speculative",
            provenance_basis: "Collision of mechanical metamaterial bistability with variable stiffness actuation. No prior work combines these.",
            novelty: "Novel mechanism class — stiffness from geometry, not material properties",
            testable: true,
            falsification: "If bistable transitions require more energy than direct actuation, or if fatigue in snap-through elements limits cycle life",
            confidence: "low"
          },
          {
            id: "H5",
            statement: "Nobody measures real-time stiffness during grasping — all characterization is quasi-static. If dynamic stiffness during object interaction differs from quasi-static measurements, current benchmarks are misleading and the 10:1 requirement may be wrong.",
            mechanism: "Dynamic effects (viscoelasticity, rate-dependent jamming, inertial contributions) may increase effective stiffness during rapid grasping. The functional stiffness ratio during real use may be 2-3x higher than quasi-static measurements suggest.",
            generation_method: "absence",
            provenance_type: "speculative",
            provenance_basis: "Rate-dependent behaviour is well-known in polymer mechanics but not characterized in soft gripper stiffness modulation",
            novelty: "Questions the measurement paradigm, not the mechanism",
            testable: true,
            falsification: "If dynamic and quasi-static stiffness measurements converge within 20% across relevant strain rates",
            confidence: "medium"
          }
        ],
        strongest_hypothesis: "H1 — composite electrostatic jamming + LMPA locks. Highest feasibility because both mechanisms are independently validated. Primary risk is interface engineering.",
        most_novel_hypothesis: "H4 — metamaterial bistable lattice. Novel mechanism class with potentially transformative stiffness ratio, but lowest technology readiness."
      }
    },
    {
      id: "experimental",
      label: "Experimental Design",
      data: {
        experiments: [
          { id: "E1", tests_hypothesis: "H1", title: "Composite jamming-LMPA gripper prototype", method: "Fabricate 3-finger gripper with electrostatic jamming layers and embedded LMPA micro-elements. Characterize stiffness ratio, response time, and cycle life.", variables: { independent: ["LMPA volume fraction", "Heating geometry"], dependent: ["Stiffness ratio", "Transition time", "Cycle life"], controlled: ["Jamming voltage", "Temperature", "Layer count"] }, expected_outcome: ">10:1 ratio, <500ms combined response", null_result_meaning: "Interface engineering between mechanisms is the actual bottleneck", minimum_viable_experiment: "Single-finger test coupon with 3 LMPA elements in jamming stack", equipment_required: ["Instron tensile tester", "Thermal camera", "High-voltage supply", "Silicone casting equipment"], estimated_duration: "8 weeks", estimated_cost: "12000", success_metric: "Stiffness ratio >10:1 AND response <500ms AND cycle life >10K" },
          { id: "E2", tests_hypothesis: "H2", title: "Impedance control compensation study", method: "Simulate variable impedance controller with existing 4:1 mechanism. Test grasping across 20-object benchmark.", variables: { independent: ["Control bandwidth", "Stiffness ratio"], dependent: ["Grasp success rate", "Object damage rate"], controlled: ["Object set", "Approach velocity"] }, expected_outcome: "4:1 mechanism + 100Hz control matches 10:1 open-loop across >80% of objects", null_result_meaning: "Mechanical stiffness ratio cannot be compensated by control for fragile objects", minimum_viable_experiment: "Simulation with validated soft body dynamics", equipment_required: ["MuJoCo simulation", "Tactile sensor array", "Existing 4:1 gripper"], estimated_duration: "4 weeks", estimated_cost: "3000", success_metric: "Grasp success >90% on 20-object benchmark with 4:1 mechanism" },
          { id: "E3", tests_hypothesis: "H3", title: "Spatial stiffness gradient characterization", method: "Fabricate grippers with three gradient profiles. Test against uniform-stiffness baseline across object set.", variables: { independent: ["Gradient profile", "Base-to-tip ratio"], dependent: ["Grasp stability", "Object deformation"], controlled: ["Total material volume", "Finger geometry"] }, expected_outcome: "Gradient grippers match or exceed uniform 10:1 gripper with only 4:1 material ratio", null_result_meaning: "Spatial modulation insufficient for heavy rigid objects", minimum_viable_experiment: "Single finger with 3D-printed gradient stiffness", equipment_required: ["Multi-material 3D printer", "Force-torque sensor", "Object benchmark set"], estimated_duration: "6 weeks", estimated_cost: "8000", success_metric: "Gradient gripper success rate within 5% of 10:1 uniform baseline" }
        ],
        summary: { total_experiments: 3, shortest_path_weeks: 4, estimated_total_cost: "23000", kill_signal_count: 3 },
        sequence: "E2 first (cheapest, fastest, reframes the problem if successful) → E3 (moderate cost, validates gradient approach) → E1 (most expensive, highest potential, benefits from E2/E3 learnings)",
        kill_signals: [
          { signal: "Composite jamming-LMPA interface fails mechanically before 1000 cycles", threshold: "1000 cycles", provenance: "estimate", provenance_detail: "10x below minimum viable for any commercial application" },
          { signal: "No object set where 4:1 + control matches 10:1 open-loop", threshold: "< 50% benchmark match", provenance: "standard", provenance_detail: "Below useful equivalence threshold" },
          { signal: "LMPA transition time cannot reach <1 second at required volumes", threshold: "1 second", provenance: "estimate", provenance_detail: "2x relaxed from 500ms target as minimum progress indicator" }
        ]
      }
    },
    {
      id: "validation",
      label: "Validation & Governance",
      data: {
        validation_framework: {
          internal_validity: ["Stiffness measurements on calibrated Instron with 3+ replicates", "Cycle life tested to failure, not truncated", "Control experiments with single-mechanism baselines"],
          external_validity: ["20-object benchmark spanning 1g-2kg, rigid/deformable/fragile", "Independent replication protocol published with designs"],
          reproducibility_requirements: ["All CAD files open-sourced", "Fabrication protocol with tolerances specified", "Material suppliers and lot numbers recorded"],
          peer_review_readiness: "Results suitable for Science Robotics or Soft Robotics journal submission after E1+E3 completion"
        },
        governance: {
          decision_gates: [
            { gate: "Gate 1: Mechanism validation", criteria: "At least one mechanism achieves >8:1 ratio with <1s response in single-finger test", authority: "PI review" },
            { gate: "Gate 2: Integration test", criteria: "Full gripper achieves benchmark grasp success >85%", authority: "PI + industry advisor" },
            { gate: "Gate 3: Durability", criteria: "Cycle life >50K with <20% performance degradation", authority: "PI + manufacturing partner" }
          ],
          halt_triggers: ["No mechanism exceeds 5:1 ratio after 8 weeks", "Fabrication yield below 50%", "Key equipment failure with >4 week replacement time"],
          abandonment_threshold: "Gate 1 failure with all three mechanisms — indicates fundamental physical limitation rather than engineering challenge",
          pivot_criteria: "If H2 (control compensation) succeeds but H1/H3 fail — pivot to pure controls approach and abandon materials research"
        },
        timeline: {
          phase_1: { duration: "8 weeks", deliverable: "Mechanism validation (E2 + E3)", gate: "Gate 1" },
          phase_2: { duration: "8 weeks", deliverable: "Composite prototype (E1) + integration", gate: "Gate 2" },
          phase_3: { duration: "4 weeks", deliverable: "Durability testing + paper preparation", gate: "Gate 3" }
        },
        resource_requirements: {
          personnel: ["1 PhD researcher (full time)", "1 technician (50%)", "PI oversight (10%)"],
          compute: "MuJoCo simulation cluster — 500 GPU-hours",
          budget: "£23,000 direct costs + £8,000 personnel",
          partnerships_needed: ["Multi-material 3D printing facility", "Instron testing lab access"]
        },
        executive_summary: "A 20-week programme to determine whether composite stiffness mechanisms, spatial gradients, or control compensation can break the single-mechanism trade-off in soft robotic grippers. Three parallel experiments with decreasing cost and increasing novelty, sequenced to maximise early learning. Three kill signals enforce discipline.",
        one_sentence: "For £31K over 20 weeks, we will determine whether composite mechanisms can break the stiffness-speed-power trade-off in soft grippers, with three kill signals and a control-compensation fallback if materials approaches fail."
      }
    }
  ];
}

// ─── Decision Engine ────────────────────────────────────────────────

export function deterministicDEC(brief = "Should we proceed with the biomineralisation scale-up?", context = "") {
  const b = brief.substring(0, 80);

  return [
    {
      id: "strategic_assessment",
      label: "Strategic Assessment",
      data: {
        governing_tension: `Scale ambition conflicts with evidence maturity. The technology shows promise at lab scale but the jump to manufacturing involves crossing multiple uncertainty thresholds simultaneously. Moving fast risks capital on unvalidated assumptions; moving slow risks losing the competitive window. Context: ${b}`,
        failure_pathway: "Most likely failure: commit to manufacturing scale-up before understanding whether the fundamental mechanism works at intermediate scales. Spend 60% of budget on manufacturing infrastructure that becomes stranded when the 5cm-to-10cm transition reveals a physics problem, not an engineering problem. Team burns out debugging manufacturing when they should be doing science.",
        state_of_art: "Current best practice for deep-tech scale-up follows a staged de-risking approach: validate mechanism at 2-3 intermediate scales before committing to manufacturing. The '3x rule' — never scale more than 3x in a single step — is well-established in chemical engineering and increasingly adopted in materials science. Most failed scale-ups skip intermediate validation stages due to funding pressure or competitive anxiety (SRC-1, SRC-3).",
        key_sources: [
          { title: "Staged de-risking in deep-tech commercialisation", finding: "Companies that validate at 3+ intermediate scales before manufacturing commitment have 4x higher success rate (SRC-1)", source_ref: "SRC-1" },
          { title: "The 3x scaling rule in materials processing", finding: "Scaling beyond 3x linear dimension in a single step introduces unpredictable failure modes in >70% of cases (SRC-3)", source_ref: "SRC-3" },
          { title: "Competitive timing in materials startups", finding: "First-mover advantage in materials is weak — process reliability and cost matter more than speed to market (SRC-5)", source_ref: "SRC-5" },
          { title: "Capital efficiency in deep-tech R&D", finding: "Staged funding with kill criteria reduces median capital waste by 40% compared to lump-sum commitments (SRC-7)", source_ref: "SRC-7" }
        ]
      }
    },
    {
      id: "options_analysis",
      label: "Options Analysis",
      data: {
        options: [
          {
            id: "O1",
            title: "Full scale-up commitment",
            summary: "Commit to manufacturing-scale development immediately. Highest upside if mechanism works, highest downside if it doesn't.",
            pros: ["Fastest to market if successful", "Attracts manufacturing partners", "Clear narrative for investors"],
            cons: ["£2M+ capital at risk before mechanism validated at intermediate scale", "Team capacity split between science and engineering", "Stranded asset risk if physics doesn't scale"]
          },
          {
            id: "O2",
            title: "Staged de-risking with kill gates",
            summary: "Three-phase programme: 1cm → 5cm → 10cm with kill criteria at each gate. Slower but capital-efficient.",
            pros: ["Capital-efficient — 70% of spend is after mechanism validation", "Kill criteria prevent stranded investment", "Scientific understanding deepens at each stage", "Paper outputs at each phase (reputation building)"],
            cons: ["6-9 months slower to manufacturing", "Competitors may move faster (but first-mover advantage is weak in materials)", "Requires discipline to actually kill if gates fail"]
          },
          {
            id: "O3",
            title: "License and partner",
            summary: "License the technology to an established materials company. Lower return, lower risk, faster validation through partner's existing infrastructure.",
            pros: ["De-risks manufacturing entirely", "Partner's existing supply chain and customer base", "Revenue from licensing fees during development"],
            cons: ["Loss of control over development direction", "Lower long-term value capture", "Partner may deprioritize if their core business demands attention", "IP negotiation complexity"]
          }
        ],
        recommended_option: { id: "O2", rationale: "Staged de-risking is the dominant strategy under uncertainty. The competitive window is long enough (first-mover advantage is weak in materials) to absorb the 6-9 month delay. Capital efficiency matters more than speed given the funding constraints. If staged approach succeeds at 5cm, it de-risks O1 or O3 as the next move." },
        comparison_criteria: ["Capital at risk before validation", "Time to market", "Probability of success", "Information value generated", "Reputation building", "Reversibility"]
      }
    },
    {
      id: "risk_governance",
      label: "Risk & Governance",
      data: {
        kill_criteria: [
          { criterion: "No crystal formation at 5cm scale after Phase 1", threshold: "Zero viable samples at intermediate scale", numeric_required: true },
          { criterion: "Tensile strength below 60 MPa at any validated scale", threshold: "60 MPa minimum", numeric_required: true },
          { criterion: "Cost projection exceeds £500/kg at manufacturing scale", threshold: "£500/kg", numeric_required: true },
          { criterion: "Key researcher departure before Phase 2 gate", threshold: "Loss of irreplaceable domain expertise", numeric_required: false }
        ],
        structural_tests: [
          "Does the team have the right expertise mix (materials + manufacturing + characterisation)?",
          "Is the IP position clear and defensible?",
          "Are the intermediate scale facilities available and booked?",
          "Is there a credible path from Phase 3 to commercial partnership or Series A?"
        ],
        governance_gates: {
          decision_gates: [
            { gate: "Phase 1 Gate: Mechanism validation", criteria: "Crystal formation at 1-5cm with >60 MPa tensile strength", authority: "PI + Advisory Board" },
            { gate: "Phase 2 Gate: Scale demonstration", criteria: "Reproducible >100 MPa at 5cm, CV <25%, cost model validated", authority: "PI + Advisory Board + Industry Partner" },
            { gate: "Phase 3 Gate: Manufacturing readiness", criteria: ">10cm demonstration, cost <£200/kg, process documented for transfer", authority: "Full Board" }
          ],
          halt_triggers: [
            "Any kill criterion triggered",
            "Budget overrun >30% in any single phase",
            "Two consecutive gate delays >4 weeks",
            "Safety incident in fabrication lab"
          ],
          abandonment_threshold: "Phase 1 gate failure OR two kill criteria triggered simultaneously"
        }
      }
    },
    {
      id: "board_brief",
      label: "Board Brief",
      data: {
        authorization_statement: "The board is asked to authorize a staged de-risking programme for biomineralisation scale-up, with £280K total budget across three phases, conditional on gate passage at each phase boundary.",
        conditions: [
          "Phase 1 budget (£80K) released immediately; Phase 2 (£120K) contingent on Gate 1 passage; Phase 3 (£80K) contingent on Gate 2 passage",
          "Key researcher retention agreement signed before Phase 1 start",
          "IP audit completed and freedom-to-operate opinion obtained within 60 days",
          "Quarterly progress reports to Advisory Board with explicit gate assessment"
        ],
        prohibitions: [
          "No manufacturing infrastructure commitments before Phase 2 Gate passage",
          "No external licensing discussions before Phase 1 Gate passage",
          "No budget reallocation between phases without Board approval",
          "No hiring beyond approved headcount without gate-linked justification"
        ],
        decision_posture: "Conditions",
        the_sentence: "We recommend conditional authorization of a £280K staged programme over 9 months, releasing £80K for Phase 1 mechanism validation with three kill criteria, and unlocking subsequent phases only upon gate passage."
      }
    }
  ];
}

// ─── Convenience: full pipeline result shape ────────────────────────

/**
 * Returns the same shape as a completed pipeline run,
 * suitable for passing to computeMerkleChain, buildExportEnvelope, etc.
 *
 * @param {"rd"|"dec"} engine
 * @param {string} query - Research question or decision brief
 * @param {string} [context] - Additional context (decision engine only)
 * @returns {{ stageResults: Array, stageData: Array }}
 */
export function deterministicPipeline(engine, query, context) {
  const results = engine === "rd"
    ? deterministicRD(query)
    : deterministicDEC(query, context);

  return {
    stageResults: results,
    stageData: results.map((r) => r.data),
  };
}
