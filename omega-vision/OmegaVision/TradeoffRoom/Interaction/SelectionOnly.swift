import Foundation
import RealityKit

enum SelectionOnly {
    // Selection metadata lookup for tradeoff elements
    static func metadata(preset: ScenePreset, for entityName: String, packContext: PackContext? = nil) -> (kind: String, meaning: String, dependsOn: String)? {
        let tradeoffPreset = preset.tradeoffPreset
        
        // Check if it's an objective (O1-O3)
        if entityName.hasPrefix("O"), let objectiveMeta = InspectorCopy.objectiveMetadata(for: entityName, preset: tradeoffPreset, packContext: packContext) {
            return (
                kind: "Objective",
                meaning: objectiveMeta.meaning,
                dependsOn: "This represents a conceptual goal, not a prescription to choose this."
            )
        }
        
        // Check if it's a constraint (K1-K3)
        if entityName.hasPrefix("K"), let constraintMeta = InspectorCopy.constraintMetadata(for: entityName, preset: tradeoffPreset, packContext: packContext) {
            return (
                kind: "Constraint",
                meaning: constraintMeta.meaning,
                dependsOn: "This represents a conceptual boundary, not a command."
            )
        }
        
        // Check if it's a tradeoff front point (T1-T7)
        if entityName.hasPrefix("T"), let frontMeta = InspectorCopy.tradeoffFrontMetadata(for: entityName, preset: tradeoffPreset, packContext: packContext) {
            return (
                kind: "Tradeoff Front",
                meaning: frontMeta.meaning,
                dependsOn: "This shows tension between objectives, not a best choice."
            )
        }
        
        // Use canonical non-selectable check (also check room-specific patterns)
        if InteractionContract.isNonSelectable(entityName) ||
           entityName.hasPrefix("F") || // Feasible region
           entityName.hasPrefix("U") {  // Uncertainty halos (room-specific)
            return nil
        }
        
        return nil
    }
}

