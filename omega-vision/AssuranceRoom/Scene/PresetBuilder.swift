import Foundation
import RealityKit

enum PresetBuilder {
    static func build(preset: ScenePreset) -> (inputs: InputsLayer, authority: AuthorityLayer, outcomes: OutcomesLayer, overrides: OverridesLayer, trace: TraceLayer) {
        // Build all layers (V1 uses default geometry - preset only changes Inspector copy)
        return (InputsLayer(), AuthorityLayer(), OutcomesLayer(), OverridesLayer(), TraceLayer())
    }
}
