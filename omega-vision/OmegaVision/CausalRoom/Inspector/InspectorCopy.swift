import Foundation

enum InspectorCopy {
    static let noAdviceLine = "No advice. No recommendations. No conclusions."
    static let readOnlyLine = "Read-only metadata for orientation."
    
    // Node-specific metadata lookup (uses pack override, then preset, then defaults)
    static func nodeMetadata(for nodeId: String, preset: CausalPreset? = nil, packContext: PackContext? = nil) -> (title: String, meaning: String)? {
        // Default titles and meanings
        let defaultTitles: [String: String] = [
            "N1": "Sensor Quality",
            "N2": "Estimator Drift",
            "N3": "Control Authority",
            "N4": "Environment",
            "N5": "Time Pressure",
            "N6": "Landing Outcome"
        ]
        
        let defaultMeanings: [String: String] = [
            "N1": "Represents the quality and reliability of sensor inputs. This is a conceptual label, not a measurement.",
            "N2": "Represents drift in estimation processes over time. This is a conceptual label, not a measurement.",
            "N3": "Represents the available control authority in the system. This is a conceptual label, not a measurement.",
            "N4": "Represents environmental conditions and constraints. This is a conceptual label, not a measurement.",
            "N5": "Represents temporal constraints and urgency factors. This is a conceptual label, not a measurement.",
            "N6": "Represents potential landing outcomes. This is a conceptual label, not a measurement."
        ]
        
        guard let defaultTitle = defaultTitles[nodeId], let defaultMeaning = defaultMeanings[nodeId] else { return nil }
        
        // Priority: pack override > preset > default
        let packTitle = PackOverrides.packTitle(room: "causalRoom", id: nodeId, pack: packContext?.pack)
        let packMeaning = PackOverrides.packMeaning(room: "causalRoom", id: nodeId, pack: packContext?.pack)
        
        let title = packTitle ?? preset?.nodeTitles[nodeId] ?? defaultTitle
        let meaning = packMeaning ?? preset?.nodeMeanings?[nodeId] ?? defaultMeaning
        
        return (title, meaning)
    }
    
    // Link metadata lookup
    static func linkMetadata(for linkId: String) -> (title: String, from: String, to: String, meaning: String, boundary: String)? {
        guard let spec = LinkMetadataStore.shared.get(linkId) else { return nil }
        return (
            title: spec.title,
            from: spec.fromNodeId,
            to: spec.toNodeId,
            meaning: spec.meaning,
            boundary: spec.boundary
        )
    }
    
    // Disallowed link metadata lookup
    static func disallowedLinkMetadata(for linkId: String) -> (title: String, from: String, to: String, reason: String)? {
        guard let spec = DisallowedLinkMetadataStore.shared.get(linkId) else { return nil }
        return (
            title: spec.title,
            from: spec.fromNodeId,
            to: spec.toNodeId,
            reason: spec.reason
        )
    }
}

