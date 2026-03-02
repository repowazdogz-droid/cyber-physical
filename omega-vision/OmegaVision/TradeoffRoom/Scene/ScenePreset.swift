import Foundation

enum ScenePreset: String, CaseIterable, Identifiable {
    case roboticsSafety = "Robotics Safety"
    case clinicalRobotics = "Clinical Robotics"
    case researchAcademia = "Research / Academia"
    
    var id: String { rawValue }
    
    var tradeoffPreset: TradeoffPreset {
        switch self {
        case .roboticsSafety:
            return TradeoffPresets.roboticsSafety
        case .clinicalRobotics:
            return TradeoffPresets.clinicalRobotics
        case .researchAcademia:
            return TradeoffPresets.researchAcademia
        }
    }
}

