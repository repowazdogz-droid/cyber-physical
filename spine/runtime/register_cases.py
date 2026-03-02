#!/usr/bin/env python3
"""Register all spine surgery cases in the registry."""

import sys
from pathlib import Path

# Add runtime directory to path
runtime_dir = Path(__file__).parent
sys.path.insert(0, str(runtime_dir.parent.parent))

from spine.runtime.registry import CaseRegistry

# Use workspace-local registry for testing
registry_path = str(Path(__file__).parent / "test_registry")
registry = CaseRegistry(registry_path=registry_path)

# Case data manually extracted from YAML files
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
        ],
        "tags": ["spine", "infection", "endoscopic", "real"]
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
        ],
        "tags": ["spine", "trauma", "cervical", "real"]
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
        ],
        "tags": ["spine", "complication", "salvage", "real"]
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
        ],
        "tags": ["spine", "complication", "vascular", "real"]
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
        ],
        "tags": ["spine", "pediatric", "complication", "real"]
    }
]

print("Registering cases...")
for case_data in cases_data:
    case_yaml_dict = {
        "problem": {
            "name": case_data["name"],
            "domain": case_data["domain"]
        },
        "constraints": case_data["constraints"],
        "uncertainties": case_data["uncertainties"],
        "objectives": case_data["objectives"]
    }
    
    case_id = registry.register_case(
        name=case_data["name"],
        domain=case_data["domain"],
        case_yaml=case_yaml_dict,
        tags=case_data["tags"],
        notes="Real case from published literature"
    )
    print(f"Registered: {case_id} - {case_data['name'][:50]}...")

print(f"\nTotal cases in registry: {len(registry.list_cases())}")
