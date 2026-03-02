import Foundation

enum AssumptionPresets {
    static let all: [AssumptionPreset] = [
        researchReasoning,
        clinicalWorkflow,
        engineeringSystems
    ]
    
    static let researchReasoning = AssumptionPreset(
        id: "research-reasoning",
        title: "Research Reasoning",
        subtitle: "Research context assumptions",
        assumptionTitles: [
            "A1": "Context stability",
            "A2": "Data representativeness",
            "A3": "Model validity",
            "A4": "Constraint fidelity",
            "A5": "Confounding risk",
            "A6": "Time-to-clarity"
        ],
        assumptionMeanings: [
            "A1": "Assumption that research context remains stable within expected bounds. This is a framing assumption, not a guarantee.",
            "A2": "Assumption that data accurately represents the phenomena under study. This is a framing assumption, not a guarantee.",
            "A3": "Assumption that the reasoning model is valid for the current research context. This is a framing assumption, not a guarantee.",
            "A4": "Assumption that stated constraints accurately reflect research boundaries. This is a framing assumption, not a guarantee.",
            "A5": "Assumption that no unaccounted confounders significantly influence research outcomes. This is a framing assumption, not a guarantee.",
            "A6": "Assumption that temporal constraints allow for adequate research clarity. This is a framing assumption, not a guarantee."
        ]
    )
    
    static let clinicalWorkflow = AssumptionPreset(
        id: "clinical-workflow",
        title: "Clinical Workflow",
        subtitle: "Clinical care assumptions",
        assumptionTitles: [
            "A1": "Patient context stable",
            "A2": "Signals reflect patient state",
            "A3": "Protocol applies here",
            "A4": "Constraints match reality",
            "A5": "No hidden risks",
            "A6": "Time criticality"
        ],
        assumptionMeanings: [
            "A1": "Assumption that patient context remains stable within expected bounds. This is a framing assumption, not a guarantee.",
            "A2": "Assumption that clinical signals accurately represent patient state. This is a framing assumption, not a guarantee.",
            "A3": "Assumption that clinical protocol is valid for the current patient context. This is a framing assumption, not a guarantee.",
            "A4": "Assumption that stated constraints accurately reflect clinical reality. This is a framing assumption, not a guarantee.",
            "A5": "Assumption that no hidden risks significantly influence patient outcomes. This is a framing assumption, not a guarantee.",
            "A6": "Assumption that temporal constraints allow for adequate clinical response. This is a framing assumption, not a guarantee."
        ]
    )
    
    static let engineeringSystems = AssumptionPreset(
        id: "engineering-systems",
        title: "Engineering Systems",
        subtitle: "Engineering system assumptions",
        assumptionTitles: [
            "A1": "Operating conditions stable",
            "A2": "Measurements represent system",
            "A3": "Assumptions match plant",
            "A4": "Constraints are correct",
            "A5": "No hidden couplings",
            "A6": "Deadline / urgency"
        ],
        assumptionMeanings: [
            "A1": "Assumption that operating conditions remain stable within expected bounds. This is a framing assumption, not a guarantee.",
            "A2": "Assumption that measurements accurately represent system state. This is a framing assumption, not a guarantee.",
            "A3": "Assumption that engineering assumptions are valid for the current plant context. This is a framing assumption, not a guarantee.",
            "A4": "Assumption that stated constraints accurately reflect system limits. This is a framing assumption, not a guarantee.",
            "A5": "Assumption that no hidden couplings significantly influence system behavior. This is a framing assumption, not a guarantee.",
            "A6": "Assumption that temporal constraints allow for adequate engineering response. This is a framing assumption, not a guarantee."
        ]
    )
    
    static func preset(id: String) -> AssumptionPreset? {
        return all.first { $0.id == id }
    }
}

