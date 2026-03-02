import Foundation
import RealityKit

enum SelectionOnly {
    // Selection metadata lookup for nodes and links
    static func metadata(preset: ScenePreset, for entityName: String, packContext: PackContext? = nil) -> (kind: String, meaning: String, dependsOn: String)? {
        // Check if it's a node (N1-N6)
        if entityName.hasPrefix("N"), let nodeMeta = InspectorCopy.nodeMetadata(for: entityName, preset: preset.causalPreset, packContext: packContext) {
            return (
                kind: "Node",
                meaning: nodeMeta.meaning,
                dependsOn: "This is a conceptual label, not a measurement."
            )
        }
        
        // Check if it's a link (LINK:L1, LINK:L2, etc.)
        if entityName.hasPrefix("LINK:"), let linkId = String(entityName.dropFirst(5)),
           let linkMeta = InspectorCopy.linkMetadata(for: linkId) {
            return (
                kind: "Link",
                meaning: "\(linkMeta.meaning) Illustrative influence, not a truth claim.",
                dependsOn: "From: \(linkMeta.from) → To: \(linkMeta.to). \(linkMeta.boundary)"
            )
        }
        
        // Check if it's a disallowed link (DISALLOWED:D1, etc.)
        if entityName.hasPrefix("DISALLOWED:"), let linkId = String(entityName.dropFirst(11)),
           let disallowedMeta = InspectorCopy.disallowedLinkMetadata(for: linkId) {
            return (
                kind: "DisallowedLink",
                meaning: "This is a boundary marker, not a claim.",
                dependsOn: "From: \(disallowedMeta.from) → To: \(disallowedMeta.to). \(disallowedMeta.reason)"
            )
        }
        
        // Use canonical non-selectable check
        if InteractionContract.isNonSelectable(entityName) {
            return nil
        }
        
        return nil
    }
}

