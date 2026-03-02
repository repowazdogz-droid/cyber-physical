import Foundation

enum TradeoffPresets {
    static let all: [TradeoffPreset] = [
        roboticsSafety,
        clinicalRobotics,
        researchAcademia
    ]
    
    static let roboticsSafety = TradeoffPreset(
        id: "robotics-safety",
        title: "Robotics Safety",
        subtitle: "Robotics safety tradeoffs",
        objectiveTitles: [
            "O1": "Safety margin",
            "O2": "Task performance",
            "O3": "Operational cost"
        ],
        objectiveMeanings: [
            "O1": "Desired reduction in harm risk under uncertainty. Not a target to maximize automatically.",
            "O2": "What success looks like for the system's function. Not prioritized here.",
            "O3": "Time/energy/complexity burden. Included to show tension, not to optimize."
        ],
        constraintTitles: [
            "K1": "Physical limits",
            "K2": "Environment limits",
            "K3": "Assurance limits"
        ],
        constraintMeanings: [
            "K1": "Hardware and dynamics bounds that constrain what is feasible.",
            "K2": "Context constraints (space, obstacles, people).",
            "K3": "What can be justified with evidence and testing. Not negotiable."
        ],
        frontTitles: [
            "T1": "Compromise point",
            "T2": "Compromise point",
            "T3": "Compromise point",
            "T4": "Compromise point",
            "T5": "Compromise point",
            "T6": "Compromise point",
            "T7": "Compromise point"
        ],
        frontMeanings: [
            "T1": "A distinct compromise between objectives under constraints. Not a recommendation.",
            "T2": "A distinct compromise between objectives under constraints. Not a recommendation.",
            "T3": "A distinct compromise between objectives under constraints. Not a recommendation.",
            "T4": "A distinct compromise between objectives under constraints. Not a recommendation.",
            "T5": "A distinct compromise between objectives under constraints. Not a recommendation.",
            "T6": "A distinct compromise between objectives under constraints. Not a recommendation.",
            "T7": "A distinct compromise between objectives under constraints. Not a recommendation."
        ]
    )
    
    static let clinicalRobotics = TradeoffPreset(
        id: "clinical-robotics",
        title: "Clinical Robotics",
        subtitle: "Clinical robotics tradeoffs",
        objectiveTitles: [
            "O1": "Patient safety",
            "O2": "Clinical usefulness",
            "O3": "Workflow burden"
        ],
        objectiveMeanings: [
            "O1": "Primary harm minimization objective. Not automatically optimized.",
            "O2": "Whether the system helps the clinician/patient in practice.",
            "O3": "Added complexity/time for staff and systems."
        ],
        constraintTitles: [
            "K1": "Clinical constraints",
            "K2": "Regulatory/ethics constraints",
            "K3": "Deployment constraints"
        ],
        constraintMeanings: [
            "K1": "Clinical rules, protocols, and real-world operating bounds.",
            "K2": "Hard boundaries: consent, risk posture, safety standards.",
            "K3": "Training, support, maintenance, and system integration limits."
        ],
        frontTitles: [
            "T1": "Compromise point",
            "T2": "Compromise point",
            "T3": "Compromise point",
            "T4": "Compromise point",
            "T5": "Compromise point",
            "T6": "Compromise point",
            "T7": "Compromise point"
        ],
        frontMeanings: [
            "T1": "A distinct compromise between objectives under constraints. Not a recommendation.",
            "T2": "A distinct compromise between objectives under constraints. Not a recommendation.",
            "T3": "A distinct compromise between objectives under constraints. Not a recommendation.",
            "T4": "A distinct compromise between objectives under constraints. Not a recommendation.",
            "T5": "A distinct compromise between objectives under constraints. Not a recommendation.",
            "T6": "A distinct compromise between objectives under constraints. Not a recommendation.",
            "T7": "A distinct compromise between objectives under constraints. Not a recommendation."
        ]
    )
    
    static let researchAcademia = TradeoffPreset(
        id: "research-academia",
        title: "Research / Academia",
        subtitle: "Research tradeoffs",
        objectiveTitles: [
            "O1": "Claim strength",
            "O2": "Novelty",
            "O3": "Practicality"
        ],
        objectiveMeanings: [
            "O1": "How strong the claims are relative to evidence. Not inflated.",
            "O2": "What is new or distinctive. Not pursued at the expense of rigor.",
            "O3": "Feasibility to execute, reproduce, and validate."
        ],
        constraintTitles: [
            "K1": "Method constraints",
            "K2": "Data constraints",
            "K3": "Interpretation constraints"
        ],
        constraintMeanings: [
            "K1": "What the method can and cannot justify.",
            "K2": "Coverage, bias, missingness, representativeness.",
            "K3": "Boundaries on what conclusions are permitted."
        ],
        frontTitles: [
            "T1": "Compromise point",
            "T2": "Compromise point",
            "T3": "Compromise point",
            "T4": "Compromise point",
            "T5": "Compromise point",
            "T6": "Compromise point",
            "T7": "Compromise point"
        ],
        frontMeanings: [
            "T1": "A distinct compromise between objectives under constraints. Not a recommendation.",
            "T2": "A distinct compromise between objectives under constraints. Not a recommendation.",
            "T3": "A distinct compromise between objectives under constraints. Not a recommendation.",
            "T4": "A distinct compromise between objectives under constraints. Not a recommendation.",
            "T5": "A distinct compromise between objectives under constraints. Not a recommendation.",
            "T6": "A distinct compromise between objectives under constraints. Not a recommendation.",
            "T7": "A distinct compromise between objectives under constraints. Not a recommendation."
        ]
    )
    
    static func preset(id: String) -> TradeoffPreset? {
        return all.first { $0.id == id }
    }
}

