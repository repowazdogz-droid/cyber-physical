"""
Presets for TSRFC – procedure and unit operation scaffolding.

These are deliberately small, explicit knowledge tables for v0:
- Spine (MIS lumbar decompression, MIS fusion)
- ENT (FESS, tonsillectomy)
- Endoscopy (colonoscopy, upper GI endoscopy)

They are not "truth", just structured starting points that can be
edited by clinicians and translational teams.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from ..models import ProcedureDomain, Setting


# High-level procedure metadata presets
PROCEDURE_PRESETS: Dict[str, Dict[str, Any]] = {
    # ----- SPINE -----
    "mis_lumbar_decompression": {
        "procedure_id": "mis_lumbar_decompression",
        "domain": ProcedureDomain.SPINE.value,
        "label": "MIS lumbar decompression (L4/5)",
        "indication_examples": [
            "lumbar spinal stenosis L4/5",
            "neurogenic claudication with central stenosis",
        ],
        "approach_examples": [
            "unilateral_laminotomy_bilateral_decompression",
            "unilateral_laminotomy_unilateral_decompression",
        ],
        "setting_default": Setting.TERTIARY.value,
        "notes": "Minimally invasive decompression for lumbar canal stenosis.",
    },
    "lumbar_fusion_mis": {
        "procedure_id": "lumbar_fusion_mis",
        "domain": ProcedureDomain.SPINE.value,
        "label": "MIS lumbar fusion (TLIF/PLIF)",
        "indication_examples": [
            "degenerative spondylolisthesis",
            "recurrent disc herniation",
        ],
        "approach_examples": [
            "mis_tlif",
            "mis_plif",
        ],
        "setting_default": Setting.TERTIARY.value,
        "notes": "Fusion procedure with interbody cage and instrumentation via MIS corridor.",
    },

    # ----- ENT -----
    "fess_maxillary_antrostomy": {
        "procedure_id": "fess_maxillary_antrostomy",
        "domain": ProcedureDomain.ENT.value,
        "label": "FESS – maxillary antrostomy",
        "indication_examples": [
            "chronic rhinosinusitis",
            "recurrent acute sinusitis",
        ],
        "approach_examples": [
            "endoscopic_nasal",
        ],
        "setting_default": Setting.TERTIARY.value,
        "notes": "Endoscopic sinus surgery focusing on maxillary sinus drainage.",
    },
    "tonsillectomy": {
        "procedure_id": "tonsillectomy",
        "domain": ProcedureDomain.ENT.value,
        "label": "Tonsillectomy",
        "indication_examples": [
            "recurrent tonsillitis",
            "obstructive sleep apnoea in children",
        ],
        "approach_examples": [
            "cold_steel",
            "coblation",
            "electrocautery",
        ],
        "setting_default": Setting.DISTRICT.value,
        "notes": "Common ENT procedure; useful as a contrast for adoption and evidence dynamics.",
    },

    # ----- ENDOSCOPY -----
    "colonoscopy_screening": {
        "procedure_id": "colonoscopy_screening",
        "domain": ProcedureDomain.ENDOSCOPY.value,
        "label": "Colonoscopy (screening)",
        "indication_examples": [
            "bowel cancer screening",
            "polyp surveillance",
        ],
        "approach_examples": [
            "standard_flexible_colonoscopy",
        ],
        "setting_default": Setting.DISTRICT.value,
        "notes": "High-volume, protocolised procedure with strong evidence base and workflow constraints.",
    },
    "upper_gi_endoscopy_diagnostic": {
        "procedure_id": "upper_gi_endoscopy_diagnostic",
        "domain": ProcedureDomain.ENDOSCOPY.value,
        "label": "Upper GI endoscopy (diagnostic)",
        "indication_examples": [
            "dyspepsia",
            "upper GI bleeding investigation",
        ],
        "approach_examples": [
            "standard_flexible_gastroscopy",
        ],
        "setting_default": Setting.DISTRICT.value,
        "notes": "Diagnostic gastroscopy – good testbed for workflow and adoption reasoning.",
    },
}


# Unit operation presets, by procedure_id
# Each entry is a list of dicts that can be turned into UnitOperation dataclasses.
UNIT_OPERATION_PRESETS: Dict[str, List[Dict[str, Any]]] = {
    # ----- SPINE: MIS lumbar decompression -----
    "mis_lumbar_decompression": [
        {
            "op_id": "spine_mis_lumbar_01",
            "name": "Positioning and setup",
            "primary_goal": "Safe prone positioning with appropriate padding and monitoring.",
            "typical_issues": [
                "pressure areas",
                "line access",
                "equipment layout variability",
            ],
            "innovation_hooks": [
                "standardised setup bundles",
                "integrated positioning aids",
            ],
        },
        {
            "op_id": "spine_mis_lumbar_02",
            "name": "Imaging and level confirmation",
            "primary_goal": "Confirm correct lumbar level (e.g. L4/5).",
            "typical_issues": [
                "wrong-level surgery risk",
                "fluoroscopy time",
            ],
            "innovation_hooks": [
                "smarter level confirmation overlays",
                "reduced radiation techniques",
            ],
        },
        {
            "op_id": "spine_mis_lumbar_03",
            "name": "Skin incision and dilator placement",
            "primary_goal": "Create safe corridor to lamina.",
            "typical_issues": [
                "guidewire control",
                "radiation exposure",
            ],
            "innovation_hooks": [
                "haptic feedback on depth",
                "visual guidance tools",
            ],
        },
        {
            "op_id": "spine_mis_lumbar_04",
            "name": "Tubular retractor docking",
            "primary_goal": "Stable working channel with minimal muscle trauma.",
            "typical_issues": [
                "docking stability",
                "line-of-sight limitations",
            ],
            "innovation_hooks": [
                "adaptive docking systems",
                "feedback on placement quality",
            ],
        },
        {
            "op_id": "spine_mis_lumbar_05",
            "name": "Ipsilateral decompression",
            "primary_goal": "Remove bone/ligament to decompress ipsilateral nerve root.",
            "typical_issues": [
                "landmark visibility",
                "bleeding obscuring field",
                "neural injury risk",
            ],
            "innovation_hooks": [
                "bounded resection zones",
                "guardrail instruments",
            ],
        },
        {
            "op_id": "spine_mis_lumbar_06",
            "name": "Contralateral decompression",
            "primary_goal": "Undercutting to decompress contralateral side.",
            "typical_issues": [
                "depth perception",
                "dural tear risk",
                "under/over-decompression",
            ],
            "innovation_hooks": [
                "navigation-assisted safe envelope",
                "visualisation augmentation",
            ],
        },
        {
            "op_id": "spine_mis_lumbar_07",
            "name": "Hemostasis",
            "primary_goal": "Achieve hemostasis and prevent postoperative hematoma.",
            "typical_issues": [
                "thermal spread",
                "time-consuming bleeding control",
            ],
            "innovation_hooks": [
                "targeted hemostasis tools",
                "better visualisation under bleed",
            ],
        },
        {
            "op_id": "spine_mis_lumbar_08",
            "name": "Closure",
            "primary_goal": "Layered closure with low infection and CSF leak risk.",
            "typical_issues": [
                "CSF leak detection",
                "time pressure at end of case",
            ],
            "innovation_hooks": [
                "CSF leak detection aids",
                "ergonomic closure tools",
            ],
        },
        {
            "op_id": "spine_mis_lumbar_09",
            "name": "Immediate post-op monitoring",
            "primary_goal": "Monitor neurological status, pain, and early complications.",
            "typical_issues": [
                "handover quality",
                "early complication detection",
            ],
            "innovation_hooks": [
                "structured post-op checklists",
                "early warning data capture",
            ],
        },
    ],

    # ----- SPINE: MIS lumbar fusion (simplified) -----
    "lumbar_fusion_mis": [
        {
            "op_id": "spine_mis_fusion_01",
            "name": "Positioning and setup",
            "primary_goal": "Safe prone positioning with radiolucent table.",
            "typical_issues": [
                "access to pedicles",
                "fluoroscopy angles",
            ],
            "innovation_hooks": [
                "navigation-guided setup",
            ],
        },
        {
            "op_id": "spine_mis_fusion_02",
            "name": "Pedicle screw placement",
            "primary_goal": "Accurate screw placement without breach.",
            "typical_issues": [
                "radiation exposure",
                "trajectory accuracy",
            ],
            "innovation_hooks": [
                "robotic-guided trajectories",
                "navigation overlays",
            ],
        },
        # Further ops omitted for brevity in v0.
    ],

    # ----- ENT: FESS (maxillary antrostomy) -----
    "fess_maxillary_antrostomy": [
        {
            "op_id": "ent_fess_01",
            "name": "Nasal preparation and decongestion",
            "primary_goal": "Improve visualisation and reduce bleeding.",
            "typical_issues": [
                "variable mucosal response",
                "patient anatomy variation",
            ],
            "innovation_hooks": [
                "standardised prep protocols",
                "decision support for decongestant use",
            ],
        },
        {
            "op_id": "ent_fess_02",
            "name": "Endoscope insertion and orientation",
            "primary_goal": "Safe endoscope navigation to middle meatus.",
            "typical_issues": [
                "orientation loss",
                "fogging",
            ],
            "innovation_hooks": [
                "orientation overlays",
                "anti-fog solutions",
            ],
        },
        {
            "op_id": "ent_fess_03",
            "name": "Maxillary antrostomy",
            "primary_goal": "Create and enlarge ostium for drainage.",
            "typical_issues": [
                "landmark identification",
                "orbital and lacrimal injury risk",
            ],
            "innovation_hooks": [
                "anatomy-guided safe zones",
                "instrument tracking",
            ],
        },
    ],

    # ----- ENT: Tonsillectomy (high-level) -----
    "tonsillectomy": [
        {
            "op_id": "ent_tonsil_01",
            "name": "Exposure",
            "primary_goal": "Adequate visualisation of tonsils.",
            "typical_issues": [
                "limited mouth opening",
                "patient positioning",
            ],
            "innovation_hooks": [
                "better paediatric exposure devices",
            ],
        },
        {
            "op_id": "ent_tonsil_02",
            "name": "Tonsil dissection",
            "primary_goal": "Remove tonsil tissue safely.",
            "typical_issues": [
                "bleeding",
                "capsule plane identification",
            ],
            "innovation_hooks": [
                "energy modality optimisation",
                "capsule plane indicators",
            ],
        },
    ],

    # ----- ENDOSCOPY: Colonoscopy -----
    "colonoscopy_screening": [
        {
            "op_id": "endo_colon_01",
            "name": "Insertion to caecum",
            "primary_goal": "Reach caecum safely and efficiently.",
            "typical_issues": [
                "looping",
                "patient discomfort",
            ],
            "innovation_hooks": [
                "loop detection/mitigation tools",
                "dynamic stiffness scopes",
            ],
        },
        {
            "op_id": "endo_colon_02",
            "name": "Withdrawal and inspection",
            "primary_goal": "Systematic mucosal inspection.",
            "typical_issues": [
                "variable withdrawal time",
                "missed lesions",
            ],
            "innovation_hooks": [
                "AI-assisted polyp detection",
                "withdrawal-time guidance",
            ],
        },
    ],

    # ----- ENDOSCOPY: Upper GI -----
    "upper_gi_endoscopy_diagnostic": [
        {
            "op_id": "endo_ugi_01",
            "name": "Oesophageal inspection",
            "primary_goal": "Identify pathology in oesophagus.",
            "typical_issues": [
                "missed Barrett's segments",
            ],
            "innovation_hooks": [
                "targeted imaging modes",
            ],
        },
        {
            "op_id": "endo_ugi_02",
            "name": "Gastric and duodenal inspection",
            "primary_goal": "Systematic inspection of stomach and duodenum.",
            "typical_issues": [
                "blind spots",
                "foam/bile obscuring view",
            ],
            "innovation_hooks": [
                "standardised inspection protocols",
                "real-time completeness feedback",
            ],
        },
    ],
}


def get_procedure_preset(procedure_id: str) -> Optional[Dict[str, Any]]:
    """Return metadata for a known procedure_id, or None if unknown."""
    return PROCEDURE_PRESETS.get(procedure_id)


def get_unit_ops_preset(procedure_id: str) -> List[Dict[str, Any]]:
    """Return unit operation presets for a procedure_id (list may be empty)."""
    return UNIT_OPERATION_PRESETS.get(procedure_id, [])






