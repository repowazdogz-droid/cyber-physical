import Foundation
import RealityKit

enum PresetBuilder {
    static func build(preset: ScenePreset) -> (assumptions: AssumptionsLayer, conflicts: ConflictsLayer, unsupported: UnsupportedLayer, uncertainty: UncertaintyLayer) {
        // Build all layers (V1 uses default geometry)
        return (AssumptionsLayer(), ConflictsLayer(), UnsupportedLayer(), UncertaintyLayer())
    }
}

