import Foundation
import RealityKit

enum SelectionOnly {
    // Selection metadata lookup for room elements
    static func metadata(preset: ScenePreset, for entityName: String, packContext: PackContext? = nil) -> (kind: String, meaning: String, dependsOn: String)? {
        // Placeholder: implement room-specific selection logic
        // Example pattern:
        // if entityName.hasPrefix("ELEMENT:"), let elementId = String(entityName.dropFirst(8)),
        //    let elementMeta = InspectorCopy.elementMetadata(for: elementId, preset: preset, packContext: packContext) {
        //     return (
        //         kind: "Element",
        //         meaning: elementMeta.meaning,
        //         dependsOn: "This is a conceptual label, not a measurement."
        //     )
        // }
        
        // Ignore uncertainty halos, dash segments, and other non-selectable entities
        if entityName.contains("Uncertainty_Halo") || entityName.contains("Halo") || entityName.hasPrefix("DASH:") {
            return nil
        }
        
        return nil
    }
}

































