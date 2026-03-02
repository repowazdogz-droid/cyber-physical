#!/usr/bin/env python3
"""Analyze all registered cases and record runs."""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from spine.runtime.registry import CaseRegistry
from spine.runtime.analyzer import DecisionAnalyzer
from spine.runtime.schemas import CaseInput, ProblemDefinition

# Use workspace-local registry for testing
registry_path = str(Path(__file__).parent / "test_registry")
registry = CaseRegistry(registry_path=registry_path)
analyzer = DecisionAnalyzer()

# Case data matching what was registered
cases_data = [
    {
        "name": "Full endoscopic debridement for severe lumbosacral discitis",
        "domain": "spine_surgery",
        "constraints": [
            "anatomically_difficult_ventral_access",
            "severe_spinal_stenosis_from_phlegmon",
            "iatrogenic_infection_origin",
            "patient_age: 64",
            "female_patient"
        ],
        "uncertainties": [
            "endoscopic_vs_open_debridement_efficacy: unknown_comparison",
            "percutaneous_screw_stability_in_infection: untested_long_term",
            "fusion_rate_in_infected_tissue: variable"
        ],
        "objectives": [
            "neural_decompression",
            "pathogen_identification",
            "mechanical_stabilization",
            "infection_resolution"
        ]
    },
    {
        "name": "Posterior stabilization for extreme C6/C7 dislocation with cord transection",
        "domain": "spine_surgery",
        "constraints": [
            "extreme_mechanical_instability",
            "spinal_shock_at_admission",
            "complete_cord_transection",
            "patient_age: 22",
            "trauma_case_mva"
        ],
        "uncertainties": [
            "optimal_surgical_timing_in_complete_transection: debated",
            "functional_recovery_potential: extremely_low",
            "one_stage_vs_two_stage_approach: unclear_benefit"
        ],
        "objectives": [
            "restore_spinal_alignment",
            "immediate_mechanical_stabilization",
            "prevent_secondary_injury"
        ]
    },
    {
        "name": "Hyperbaric oxygen therapy for post-operative foot drop",
        "domain": "spine_surgery",
        "constraints": [
            "failed_conservative_management",
            "acute_traumatic_nerve_ischemia",
            "multiple_motor_levels_L2_S1",
            "patient_age: 50",
            "post_revision_surgery"
        ],
        "uncertainties": [
            "hbot_duration_and_dosage: no_standard_protocol",
            "recovery_timeline_predictability: low",
            "nerve_recovery_ceiling: unknown"
        ],
        "objectives": [
            "improve_neurologic_recovery",
            "restore_lower_limb_power",
            "restore_ambulation"
        ]
    },
    {
        "name": "Revision surgery for thoracic pedicle screw aortic penetration",
        "domain": "spine_surgery",
        "constraints": [
            "aorta_proximity_to_T6_T7: millimeters",
            "freehand_screw_placement_inaccuracy",
            "urgent_stabilization_required",
            "patient_age: 53",
            "trauma_with_paraplegia"
        ],
        "uncertainties": [
            "pseudoaneurysm_risk: unknown_timeline",
            "delayed_aortic_rupture_probability: unclear",
            "asymptomatic_impingement_management: no_consensus"
        ],
        "objectives": [
            "stabilize_T7_fracture",
            "mitigate_vascular_injury",
            "prevent_aortic_rupture"
        ]
    },
    {
        "name": "Hemivertebra resection complicated by remote cerebellar hemorrhage",
        "domain": "spine_surgery",
        "constraints": [
            "patient_age: 5.5_years",
            "small_anatomical_structures",
            "high_kyphotic_angle: 70_degrees",
            "congenital_deformity",
            "pediatric_dural_management"
        ],
        "uncertainties": [
            "rch_pathophysiology: poorly_understood",
            "pediatric_icp_change_prediction: unreliable",
            "growth_preservation_vs_fusion: tradeoff"
        ],
        "objectives": [
            "correct_kyphotic_deformity",
            "maintain_spinal_growth_potential",
            "safe_hemivertebra_resection"
        ]
    }
]

print("Analyzing cases and recording runs...\n")

for case_data in cases_data:
    # Find the case_id
    all_cases = registry.list_cases()
    case_id = None
    for c in all_cases:
        if c['name'] == case_data["name"]:
            case_id = c['case_id']
            break
    
    if case_id:
        # Reconstruct CaseInput
        case = CaseInput(
            problem=ProblemDefinition(
                name=case_data["name"],
                domain=case_data["domain"]
            ),
            constraints=case_data["constraints"],
            uncertainties=case_data["uncertainties"],
            objectives=case_data["objectives"]
        )
        
        # Run analysis
        result = analyzer.analyze(case)
        
        # Convert analysis to dict
        analysis_dict = result.model_dump()
        
        # Record run
        run_id = registry.record_run(
            case_id=case_id,
            output=analysis_dict,
            trace=result.trace_graph
        )
        print(f"Run {run_id} recorded for case {case_id[:8]}... ({case_data['name'][:40]}...)")
    else:
        print(f"Warning: Case not found in registry for {case_data['name']}")

print("\n" + "="*60)
print("Registry Statistics:")
print("="*60)
stats = registry.get_stats()
print(f"  Total Cases: {stats['total_cases']}")
print(f"  Total Runs: {stats['total_runs']}")

if stats.get('by_domain'):
    print(f"\n  By Domain:")
    for domain, count in stats['by_domain'].items():
        print(f"    {domain}: {count}")

if stats.get('by_outcome_status'):
    print(f"\n  By Outcome Status:")
    for status, count in stats['by_outcome_status'].items():
        print(f"    {status}: {count}")
