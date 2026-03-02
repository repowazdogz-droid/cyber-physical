import Foundation

enum ScenePreset: String, CaseIterable, Identifiable {
    case faultToSafeLanding = "Fault → Safe Landing"
    case clinicalWorkflow = "Clinical Workflow Dependencies"
    case roboticsLab = "Robotics Lab Reasoning Surface"
    
    var id: String { rawValue }
    
    var causalPreset: CausalPreset {
        switch self {
        case .faultToSafeLanding:
            return CausalPresets.faultToSafeLanding
        case .clinicalWorkflow:
            return CausalPresets.clinicalWorkflow
        case .roboticsLab:
            return CausalPresets.roboticsLab
        }
    }
}

