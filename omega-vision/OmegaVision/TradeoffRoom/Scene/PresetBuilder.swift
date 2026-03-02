import Foundation
import RealityKit

enum PresetBuilder {
    static func build(preset: ScenePreset) -> (objectives: ObjectivesLayer, constraints: ConstraintsLayer, feasibleRegion: FeasibleRegionLayer, tradeoffFront: TradeoffFrontLayer, uncertainty: UncertaintyLayer) {
        // Build all layers (V1 uses default geometry - empty for now)
        return (ObjectivesLayer(), ConstraintsLayer(), FeasibleRegionLayer(), TradeoffFrontLayer(), UncertaintyLayer())
    }
}

