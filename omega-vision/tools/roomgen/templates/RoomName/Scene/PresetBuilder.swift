import Foundation
import RealityKit

enum PresetBuilder {
    static func build(preset: ScenePreset) -> (structure: StructureLayer, constraints: ConstraintLayer, uncertainty: UncertaintyLayer) {
        // Build structure layer with preset data
        let structure = StructureLayer()
        
        // Other layers remain unchanged in V1
        return (structure, ConstraintLayer(), UncertaintyLayer())
    }
}

































