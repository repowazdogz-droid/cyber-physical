import Foundation

enum CausalPresets {
    static let all: [CausalPreset] = [
        faultToSafeLanding,
        clinicalWorkflow,
        roboticsLab
    ]
    
    static let faultToSafeLanding = CausalPreset(
        id: "fault-to-safe-landing",
        title: "Fault → Safe Landing",
        subtitle: "Degradation pathways and outcome boundaries",
        nodeTitles: [
            "N1": "Sensor Quality",
            "N2": "Estimator Drift",
            "N3": "Control Authority",
            "N4": "Environment",
            "N5": "Time Pressure",
            "N6": "Landing Outcome"
        ],
        nodeMeanings: nil // Use defaults
    )
    
    static let clinicalWorkflow = CausalPreset(
        id: "clinical-workflow",
        title: "Clinical Workflow Dependencies",
        subtitle: "Care pathway structure and constraints",
        nodeTitles: [
            "N1": "Patient Presentation",
            "N2": "Diagnostic Clarity",
            "N3": "Treatment Options",
            "N4": "Resource Availability",
            "N5": "Time Window",
            "N6": "Outcome Class"
        ],
        nodeMeanings: nil
    )
    
    static let roboticsLab = CausalPreset(
        id: "robotics-lab",
        title: "Robotics Lab Reasoning Surface",
        subtitle: "System dependencies and operational boundaries",
        nodeTitles: [
            "N1": "Sensor Fidelity",
            "N2": "State Estimation",
            "N3": "Actuation Capability",
            "N4": "Workspace Constraints",
            "N5": "Task Urgency",
            "N6": "Task Completion"
        ],
        nodeMeanings: nil
    )
    
    static func preset(id: String) -> CausalPreset? {
        return all.first { $0.id == id }
    }
}


































