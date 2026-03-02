import Foundation
import RealityKit

enum PresetBuilder {
    static func build(preset: ScenePreset) -> (structure: StructureLayer, constraints: ConstraintLayer, assumptions: AssumptionLayer, uncertainty: UncertaintyLayer) {
        // Build structure layer with preset node titles
        let structure = StructureLayer(preset: preset.causalPreset)
        
        // Other layers remain unchanged in V1
        return (structure, ConstraintLayer(), AssumptionLayer(), UncertaintyLayer())
    }
}

