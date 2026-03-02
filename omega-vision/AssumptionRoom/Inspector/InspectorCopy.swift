import Foundation

enum InspectorCopy {
    static let noAdviceLine = "No advice. No recommendations. No conclusions."
    static let readOnlyLine = "Read-only metadata for orientation."
    
    // Assumption metadata lookup (A1-A6) - uses pack override, then preset, then defaults
    static func assumptionMetadata(for assumptionId: String, preset: AssumptionPreset? = nil, packContext: PackContext? = nil) -> (title: String, meaning: String)? {
        // Default titles and meanings
        let defaultAssumptions: [String: (title: String, meaning: String)] = [
            "A1": (
                title: "Stable environment",
                meaning: "Assumption that environmental conditions remain stable within expected bounds. This is a framing assumption, not a guarantee."
            ),
            "A2": (
                title: "Sensor data is representative",
                meaning: "Assumption that sensor readings accurately represent the system state. This is a framing assumption, not a guarantee."
            ),
            "A3": (
                title: "Model applies in this context",
                meaning: "Assumption that the reasoning model is valid for the current context. This is a framing assumption, not a guarantee."
            ),
            "A4": (
                title: "Constraints are correctly specified",
                meaning: "Assumption that stated constraints accurately reflect real-world limits. This is a framing assumption, not a guarantee."
            ),
            "A5": (
                title: "No hidden confounders",
                meaning: "Assumption that no unaccounted factors significantly influence outcomes. This is a framing assumption, not a guarantee."
            ),
            "A6": (
                title: "Time pressure is manageable",
                meaning: "Assumption that temporal constraints allow for adequate reasoning and action. This is a framing assumption, not a guarantee."
            )
        ]
        
        guard let default = defaultAssumptions[assumptionId] else { return nil }
        
        // Priority: pack override > preset > default
        let packTitle = PackOverrides.packTitle(room: "assumptionRoom", id: assumptionId, pack: packContext?.pack)
        let packMeaning = PackOverrides.packMeaning(room: "assumptionRoom", id: assumptionId, pack: packContext?.pack)
        
        let title = packTitle ?? preset?.assumptionTitles[assumptionId] ?? default.title
        let meaning = packMeaning ?? preset?.assumptionMeanings?[assumptionId] ?? default.meaning
        
        return (title, meaning)
    }
    
    // Conflict metadata lookup (C1-C2) - uses pack override, then defaults
    static func conflictMetadata(for conflictId: String, packContext: PackContext? = nil) -> (title: String, meaning: String)? {
        let defaultConflicts: [String: (title: String, meaning: String)] = [
            "C1": (
                title: "A1 conflicts with observed variability",
                meaning: "Conflict marker: the assumption of stable environment (A1) conflicts with observed variability in the system. This highlights a tension, not a command."
            ),
            "C2": (
                title: "A3 conflicts with domain shift",
                meaning: "Conflict marker: the assumption that the model applies (A3) conflicts with evidence of domain shift. This highlights a tension, not a command."
            )
        ]
        
        guard let default = defaultConflicts[conflictId] else { return nil }
        
        // Priority: pack override > default
        let packTitle = PackOverrides.packTitle(room: "assumptionRoom", id: conflictId, pack: packContext?.pack)
        let packMeaning = PackOverrides.packMeaning(room: "assumptionRoom", id: conflictId, pack: packContext?.pack)
        
        let title = packTitle ?? default.title
        let meaning = packMeaning ?? default.meaning
        
        return (title, meaning)
    }
    
    // Unsupported metadata lookup (U1-U2)
    static func unsupportedMetadata(for unsupportedId: String) -> (title: String, meaning: String)? {
        let unsupported: [String: (title: String, meaning: String)] = [
            "U1": (
                title: "Missing measurement coverage",
                meaning: "Unsupported region marker: indicates where measurement coverage is incomplete or missing. This is a gap indicator, not a command."
            ),
            "U2": (
                title: "Unknown boundary conditions",
                meaning: "Unsupported region marker: indicates where boundary conditions are unknown or unspecified. This is a gap indicator, not a command."
            )
        ]
        
        return unsupported[unsupportedId]
    }
    
    // Uncertainty halo metadata (H1-H2) - non-selectable but documented
    static func uncertaintyHaloMetadata(for haloId: String) -> (title: String, meaning: String)? {
        let halos: [String: (title: String, meaning: String)] = [
            "H1": (
                title: "Uncertainty around A2",
                meaning: "Uncertainty halo indicating incomplete knowledge around the assumption that sensor data is representative (A2). This is a visual indicator, not selectable."
            ),
            "H2": (
                title: "Uncertainty around A6",
                meaning: "Uncertainty halo indicating incomplete knowledge around the assumption that time pressure is manageable (A6). This is a visual indicator, not selectable."
            )
        ]
        
        return halos[haloId]
    }
}

