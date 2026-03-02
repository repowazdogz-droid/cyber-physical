import Foundation

enum InspectorCopy {
    static let noAdviceLine = "No advice. No recommendations. No conclusions."
    static let readOnlyLine = "Read-only metadata for orientation."
    
    // Objective metadata lookup (O1-O3) - uses pack override, then preset, then defaults
    static func objectiveMetadata(for objectiveId: String, preset: TradeoffPreset? = nil, packContext: PackContext? = nil) -> (title: String, meaning: String)? {
        // Default titles and meanings
        let defaultObjectives: [String: (title: String, meaning: String)] = [
            "O1": (
                title: "Objective 1",
                meaning: "Represents a conceptual objective or goal. This illustrates one dimension of the tradeoff space, not a prescription to choose this."
            ),
            "O2": (
                title: "Objective 2",
                meaning: "Represents a conceptual objective or goal. This illustrates one dimension of the tradeoff space, not a prescription to choose this."
            ),
            "O3": (
                title: "Objective 3",
                meaning: "Represents a conceptual objective or goal. This illustrates one dimension of the tradeoff space, not a prescription to choose this."
            )
        ]
        
        guard let default = defaultObjectives[objectiveId] else { return nil }
        
        // Priority: pack override > preset > default
        let packTitle = PackOverrides.packTitle(room: "tradeoffRoom", id: objectiveId, pack: packContext?.pack)
        let packMeaning = PackOverrides.packMeaning(room: "tradeoffRoom", id: objectiveId, pack: packContext?.pack)
        
        let title = packTitle ?? preset?.objectiveTitles[objectiveId] ?? default.title
        let meaning = packMeaning ?? preset?.objectiveMeanings?[objectiveId] ?? default.meaning
        
        return (title, meaning)
    }
    
    // Constraint metadata lookup (K1-K3) - uses pack override, then preset, then defaults
    static func constraintMetadata(for constraintId: String, preset: TradeoffPreset? = nil, packContext: PackContext? = nil) -> (title: String, meaning: String)? {
        // Default titles and meanings
        let defaultConstraints: [String: (title: String, meaning: String)] = [
            "K1": (
                title: "Constraint 1",
                meaning: "Represents a conceptual constraint or boundary. This shows a limit in the tradeoff space, not a command."
            ),
            "K2": (
                title: "Constraint 2",
                meaning: "Represents a conceptual constraint or boundary. This shows a limit in the tradeoff space, not a command."
            ),
            "K3": (
                title: "Constraint 3",
                meaning: "Represents a conceptual constraint or boundary. This shows a limit in the tradeoff space, not a command."
            )
        ]
        
        guard let default = defaultConstraints[constraintId] else { return nil }
        
        // Priority: pack override > preset > default
        let packTitle = PackOverrides.packTitle(room: "tradeoffRoom", id: constraintId, pack: packContext?.pack)
        let packMeaning = PackOverrides.packMeaning(room: "tradeoffRoom", id: constraintId, pack: packContext?.pack)
        
        let title = packTitle ?? preset?.constraintTitles[constraintId] ?? default.title
        let meaning = packMeaning ?? preset?.constraintMeanings?[constraintId] ?? default.meaning
        
        return (title, meaning)
    }
    
    // Feasible region metadata (F1) - non-selectable but documented
    static func feasibleRegionMetadata(for regionId: String) -> (title: String, meaning: String)? {
        let regions: [String: (title: String, meaning: String)] = [
            "F1": (
                title: "Feasible Region",
                meaning: "Represents the region where all constraints are satisfied simultaneously. This is a visual indicator of possibility, not a recommendation."
            )
        ]
        
        return regions[regionId]
    }
    
    // Tradeoff front metadata lookup (T1-T7) - uses pack override, then preset, then defaults
    static func tradeoffFrontMetadata(for frontId: String, preset: TradeoffPreset? = nil, packContext: PackContext? = nil) -> (title: String, meaning: String)? {
        // Default titles and meanings
        let defaultFrontPoints: [String: (title: String, meaning: String)] = [
            "T1": (
                title: "Tradeoff Front Point 1",
                meaning: "Represents a point on the tradeoff front where objectives tension each other. This shows tension, not a best choice."
            ),
            "T2": (
                title: "Tradeoff Front Point 2",
                meaning: "Represents a point on the tradeoff front where objectives tension each other. This shows tension, not a best choice."
            ),
            "T3": (
                title: "Tradeoff Front Point 3",
                meaning: "Represents a point on the tradeoff front where objectives tension each other. This shows tension, not a best choice."
            ),
            "T4": (
                title: "Tradeoff Front Point 4",
                meaning: "Represents a point on the tradeoff front where objectives tension each other. This shows tension, not a best choice."
            ),
            "T5": (
                title: "Tradeoff Front Point 5",
                meaning: "Represents a point on the tradeoff front where objectives tension each other. This shows tension, not a best choice."
            ),
            "T6": (
                title: "Tradeoff Front Point 6",
                meaning: "Represents a point on the tradeoff front where objectives tension each other. This shows tension, not a best choice."
            ),
            "T7": (
                title: "Tradeoff Front Point 7",
                meaning: "Represents a point on the tradeoff front where objectives tension each other. This shows tension, not a best choice."
            )
        ]
        
        guard let default = defaultFrontPoints[frontId] else { return nil }
        
        // Priority: pack override > preset > default
        let packTitle = PackOverrides.packTitle(room: "tradeoffRoom", id: frontId, pack: packContext?.pack)
        let packMeaning = PackOverrides.packMeaning(room: "tradeoffRoom", id: frontId, pack: packContext?.pack)
        
        let title = packTitle ?? preset?.frontTitles?[frontId] ?? default.title
        let meaning = packMeaning ?? preset?.frontMeanings?[frontId] ?? default.meaning
        
        return (title, meaning)
    }
    
    // Uncertainty halo metadata (U1-U2) - non-selectable but documented
    static func uncertaintyHaloMetadata(for haloId: String) -> (title: String, meaning: String)? {
        let halos: [String: (title: String, meaning: String)] = [
            "U1": (
                title: "Uncertainty Halo 1",
                meaning: "Represents a region of incomplete knowledge or uncertainty. This is a visual indicator, not selectable."
            ),
            "U2": (
                title: "Uncertainty Halo 2",
                meaning: "Represents a region of incomplete knowledge or uncertainty. This is a visual indicator, not selectable."
            )
        ]
        
        return halos[haloId]
    }
    
    // Tradeoff metadata lookup (A1-A6) - uses preset if provided, else defaults
    static func assumptionMetadata(for assumptionId: String, preset: TradeoffPreset? = nil) -> (title: String, meaning: String)? {
        // Default titles and meanings
        let defaultTradeoffs: [String: (title: String, meaning: String)] = [
            "A1": (
                title: "Stable environment",
                meaning: "Tradeoff that environmental conditions remain stable within expected bounds. This is a framing assumption, not a guarantee."
            ),
            "A2": (
                title: "Sensor data is representative",
                meaning: "Tradeoff that sensor readings accurately represent the system state. This is a framing assumption, not a guarantee."
            ),
            "A3": (
                title: "Model applies in this context",
                meaning: "Tradeoff that the reasoning model is valid for the current context. This is a framing assumption, not a guarantee."
            ),
            "A4": (
                title: "Constraints are correctly specified",
                meaning: "Tradeoff that stated constraints accurately reflect real-world limits. This is a framing assumption, not a guarantee."
            ),
            "A5": (
                title: "No hidden confounders",
                meaning: "Tradeoff that no unaccounted factors significantly influence outcomes. This is a framing assumption, not a guarantee."
            ),
            "A6": (
                title: "Time pressure is manageable",
                meaning: "Tradeoff that temporal constraints allow for adequate reasoning and action. This is a framing assumption, not a guarantee."
            )
        ]
        
        guard let default = defaultTradeoffs[assumptionId] else { return nil }
        
        // Use preset title if available, else default
        let title = preset?.assumptionTitles[assumptionId] ?? default.title
        
        // Use preset meaning if available, else default
        let meaning = preset?.assumptionMeanings?[assumptionId] ?? default.meaning
        
        return (title, meaning)
    }
    
    // Conflict metadata lookup (C1-C2)
    static func conflictMetadata(for conflictId: String) -> (title: String, meaning: String)? {
        let conflicts: [String: (title: String, meaning: String)] = [
            "C1": (
                title: "A1 conflicts with observed variability",
                meaning: "Conflict marker: the assumption of stable environment (A1) conflicts with observed variability in the system. This highlights a tension, not a command."
            ),
            "C2": (
                title: "A3 conflicts with domain shift",
                meaning: "Conflict marker: the assumption that the model applies (A3) conflicts with evidence of domain shift. This highlights a tension, not a command."
            )
        ]
        
        return conflicts[conflictId]
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

