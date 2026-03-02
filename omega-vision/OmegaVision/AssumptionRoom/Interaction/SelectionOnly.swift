import Foundation
import RealityKit

enum SelectionOnly {
    // Selection metadata lookup for assumptions, conflicts, unsupported regions
    static func metadata(preset: ScenePreset, for entityName: String, packContext: PackContext? = nil) -> (kind: String, meaning: String, dependsOn: String)? {
        // Check if it's an assumption (A1-A6)
        if entityName.hasPrefix("A"), let assumptionMeta = InspectorCopy.assumptionMetadata(for: entityName, preset: preset.assumptionPreset, packContext: packContext) {
            return (
                kind: "Assumption",
                meaning: assumptionMeta.meaning,
                dependsOn: "This is a framing assumption, not a guarantee or command."
            )
        }
        
        // Check if it's a conflict volume (C1-C2) - selectable volumes only
        if entityName.hasPrefix("C"), !entityName.contains("_Outline"), let conflictMeta = InspectorCopy.conflictMetadata(for: entityName, packContext: packContext) {
            return (
                kind: "Conflict",
                meaning: conflictMeta.meaning,
                dependsOn: "This highlights a tension between assumptions, not a command."
            )
        }
        
        // Check if it's an unsupported marker (U1-U2) - selectable markers only
        if entityName.hasPrefix("U"), !entityName.contains("_Region"), let unsupportedMeta = InspectorCopy.unsupportedMetadata(for: entityName) {
            return (
                kind: "Unsupported",
                meaning: unsupportedMeta.meaning,
                dependsOn: "This indicates a gap in coverage or knowledge, not a command."
            )
        }
        
        // Use canonical non-selectable check
        if InteractionContract.isNonSelectable(entityName) {
            return nil
        }
        
        return nil
    }
}

