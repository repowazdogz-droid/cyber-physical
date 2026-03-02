import Foundation

enum ScenePreset: String, CaseIterable, Identifiable {
    case t2CausalMap = "T2 Causal Map"
    case t3AssumptionSurface = "T3 Assumption Surface"
    case t4TradeoffAtlas = "T4 Tradeoff Atlas"
    case t5AssuranceLadder = "T5 Assurance Ladder"

    var id: String { rawValue }
}


































