import Foundation

enum ScenePreset: String, CaseIterable, Identifiable {
    case researchReasoning = "Research Reasoning"
    case clinicalWorkflow = "Clinical Workflow"
    case engineeringSystems = "Engineering Systems"
    
    var id: String { rawValue }
    
    var assumptionPreset: AssumptionPreset {
        switch self {
        case .researchReasoning:
            return AssumptionPresets.researchReasoning
        case .clinicalWorkflow:
            return AssumptionPresets.clinicalWorkflow
        case .engineeringSystems:
            return AssumptionPresets.engineeringSystems
        }
    }
}

