import Foundation

enum InspectorCopy {
    static let noAdviceLine = "No advice. No recommendations. No conclusions."
    static let readOnlyLine = "Read-only metadata for orientation."
    
    // Input metadata lookup (I1-I4) - uses pack override, then preset, then defaults
    static func inputMetadata(for inputId: String, preset: AssurancePreset? = nil, packContext: PackContext? = nil) -> (title: String, meaning: String)? {
        let defaultInputs: [String: (title: String, meaning: String)] = [
            "I1": (
                title: "Fault Effect",
                meaning: "Represents degraded input or fault effect. This illustrates what degraded, not a prescription."
            ),
            "I2": (
                title: "Detection Confidence",
                meaning: "Represents detection confidence level. This illustrates uncertainty, not a guarantee."
            ),
            "I3": (
                title: "Remaining Authority",
                meaning: "Represents remaining control authority. This illustrates capability bounds, not a command."
            ),
            "I4": (
                title: "Time-to-Criticality",
                meaning: "Represents time-to-criticality estimate. This illustrates urgency bounds, not a deadline."
            )
        ]
        
        guard let default = defaultInputs[inputId] else { return nil }
        
        // Priority: pack override > preset > default
        let packTitle = PackOverrides.packTitle(room: "assuranceRoom", id: inputId, pack: packContext?.pack)
        let packMeaning = PackOverrides.packMeaning(room: "assuranceRoom", id: inputId, pack: packContext?.pack)
        
        let title = packTitle ?? preset?.inputTitles[inputId] ?? default.title
        let meaning = packMeaning ?? preset?.inputMeanings?[inputId] ?? default.meaning
        
        return (title, meaning)
    }
    
    // Authority metadata lookup (A1-A4) - uses pack override, then preset, then defaults
    static func authorityMetadata(for authorityId: String, preset: AssurancePreset? = nil, packContext: PackContext? = nil) -> (title: String, meaning: String)? {
        let defaultAuthorities: [String: (title: String, meaning: String)] = [
            "A1": (
                title: "Near-nominal",
                meaning: "Represents near-nominal authority band. This illustrates remaining control capability, not a guarantee."
            ),
            "A2": (
                title: "Reduced",
                meaning: "Represents reduced authority band. This illustrates degraded capability, not a recommendation."
            ),
            "A3": (
                title: "Marginal",
                meaning: "Represents marginal authority band. This illustrates limited capability, not a command."
            ),
            "A4": (
                title: "Uncontrolled",
                meaning: "Represents uncontrolled authority band. This illustrates loss of control, not a prediction."
            )
        ]
        
        guard let default = defaultAuthorities[authorityId] else { return nil }
        
        // Priority: pack override > preset > default
        let packTitle = PackOverrides.packTitle(room: "assuranceRoom", id: authorityId, pack: packContext?.pack)
        let packMeaning = PackOverrides.packMeaning(room: "assuranceRoom", id: authorityId, pack: packContext?.pack)
        
        let title = packTitle ?? preset?.authorityTitles[authorityId] ?? default.title
        let meaning = packMeaning ?? preset?.authorityMeanings?[authorityId] ?? default.meaning
        
        return (title, meaning)
    }
    
    // Outcome metadata lookup (S1-S4) - uses pack override, then preset, then defaults
    static func outcomeMetadata(for outcomeId: String, preset: AssurancePreset? = nil, packContext: PackContext? = nil) -> (title: String, meaning: String)? {
        let defaultOutcomes: [String: (title: String, meaning: String)] = [
            "S1": (
                title: "Stabilize & Assess",
                meaning: "Represents a bounded outcome class: stabilize and assess. This illustrates what can be guaranteed, not a procedure."
            ),
            "S2": (
                title: "Controlled Descent",
                meaning: "Represents a bounded outcome class: controlled descent. This illustrates what can be guaranteed, not a procedure."
            ),
            "S3": (
                title: "Degraded Landing",
                meaning: "Represents a bounded outcome class: degraded landing. This illustrates what can be guaranteed, not a procedure."
            ),
            "S4": (
                title: "Impact Mitigation / FTS",
                meaning: "Represents a bounded outcome class: impact mitigation or FTS. This illustrates what can be guaranteed, not a procedure."
            )
        ]
        
        guard let default = defaultOutcomes[outcomeId] else { return nil }
        
        // Priority: pack override > preset > default
        let packTitle = PackOverrides.packTitle(room: "assuranceRoom", id: outcomeId, pack: packContext?.pack)
        let packMeaning = PackOverrides.packMeaning(room: "assuranceRoom", id: outcomeId, pack: packContext?.pack)
        
        let title = packTitle ?? preset?.outcomeTitles[outcomeId] ?? default.title
        let meaning = packMeaning ?? preset?.outcomeMeanings?[outcomeId] ?? default.meaning
        
        return (title, meaning)
    }
    
    // Override metadata lookup (OVR1-OVR3) - uses pack override, then preset, then defaults
    static func overrideMetadata(for overrideId: String, preset: AssurancePreset? = nil, packContext: PackContext? = nil) -> (title: String, meaning: String)? {
        let defaultOverrides: [String: (title: String, meaning: String)] = [
            "OVR1": (
                title: "Crowd/People Present",
                meaning: "Represents a hard override constraint: crowd/people present disallows landing attempt. This illustrates an ethical boundary, not advice."
            ),
            "OVR2": (
                title: "Unperceivable",
                meaning: "Represents a hard override constraint: unperceivable conditions restrict outcomes. This illustrates a capability boundary, not a recommendation."
            ),
            "OVR3": (
                title: "Ethics Override",
                meaning: "Represents a hard override constraint: ethics override capability. This illustrates a boundary, not a command."
            )
        ]
        
        guard let default = defaultOverrides[overrideId] else { return nil }
        
        // Priority: pack override > preset > default
        let packTitle = PackOverrides.packTitle(room: "assuranceRoom", id: overrideId, pack: packContext?.pack)
        let packMeaning = PackOverrides.packMeaning(room: "assuranceRoom", id: overrideId, pack: packContext?.pack)
        
        let title = packTitle ?? preset?.overrideTitles?[overrideId] ?? default.title
        let meaning = packMeaning ?? preset?.overrideMeanings?[overrideId] ?? default.meaning
        
        return (title, meaning)
    }
    
    // Trace metadata (TR*) - non-selectable but documented
    static func traceMetadata(for traceId: String) -> (title: String, meaning: String)? {
        let traces: [String: (title: String, meaning: String)] = [
            "TR1": (
                title: "Trace Marker (Inputs)",
                meaning: "Visual indicator of traceability surface. Non-selectable."
            ),
            "TR2": (
                title: "Trace Marker (Authority)",
                meaning: "Visual indicator of traceability surface. Non-selectable."
            ),
            "TR3": (
                title: "Trace Marker (Outcomes)",
                meaning: "Visual indicator of traceability surface. Non-selectable."
            )
        ]
        
        return traces[traceId]
    }
}
