import Foundation

enum ScenePreset: String, CaseIterable, Identifiable {
    case uavSafeLanding = "UAV Safe Landing"
    case clinicalRobotics = "Clinical Robotics"
    case researchAcademia = "Research / Academia"
    
    var id: String { rawValue }
    
    var assurancePreset: AssurancePreset {
        switch self {
        case .uavSafeLanding:
            return AssurancePresets.uavSafeLanding
        case .clinicalRobotics:
            return AssurancePresets.clinicalRobotics
        case .researchAcademia:
            return AssurancePresets.researchAcademia
        }
    }
}
