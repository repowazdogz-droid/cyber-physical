import Foundation
import RealityKit

enum SelectionOnly {
    // Selection metadata lookup for assurance elements
    static func metadata(preset: ScenePreset, for entityName: String, packContext: PackContext? = nil) -> (kind: String, meaning: String, dependsOn: String)? {
        let assurancePreset = preset.assurancePreset
        
        // Check if it's an input (I1-I4)
        if entityName.hasPrefix("I"), let inputMeta = InspectorCopy.inputMetadata(for: entityName, preset: assurancePreset, packContext: packContext) {
            return (
                kind: "Input",
                meaning: inputMeta.meaning,
                dependsOn: "This represents degraded input or confidence, not a command."
            )
        }
        
        // Check if it's authority (A1-A4)
        if entityName.hasPrefix("A"), let authorityMeta = InspectorCopy.authorityMetadata(for: entityName, preset: assurancePreset, packContext: packContext) {
            return (
                kind: "Authority",
                meaning: authorityMeta.meaning,
                dependsOn: "This represents remaining control authority, not a guarantee."
            )
        }
        
        // Check if it's an outcome (S1-S4)
        if entityName.hasPrefix("S"), let outcomeMeta = InspectorCopy.outcomeMetadata(for: entityName, preset: assurancePreset, packContext: packContext) {
            return (
                kind: "Outcome",
                meaning: outcomeMeta.meaning,
                dependsOn: "This represents a bounded outcome class, not a recommendation."
            )
        }
        
        // Check if it's an override (OVR1-OVR3)
        if entityName.hasPrefix("OVR"), let overrideMeta = InspectorCopy.overrideMetadata(for: entityName, preset: assurancePreset, packContext: packContext) {
            return (
                kind: "Override",
                meaning: overrideMeta.meaning,
                dependsOn: "This represents a hard constraint that overrides capability, not advice."
            )
        }
        
        // Use canonical non-selectable check (also check room-specific patterns)
        if InteractionContract.isNonSelectable(entityName) ||
           entityName.hasPrefix("TR") { // Trace layer (room-specific)
            return nil
        }
        
        return nil
    }
}

