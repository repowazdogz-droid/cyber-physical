import Foundation

enum InspectorCopy {
    static let noAdviceLine = "No advice. No recommendations. No conclusions."
    static let readOnlyLine = "Read-only metadata for orientation."
    
    // Placeholder: add room-specific metadata lookup functions
    // Uses pack override, then preset, then defaults
    static func elementMetadata(for elementId: String, preset: ScenePreset? = nil, packContext: PackContext? = nil) -> (title: String, meaning: String)? {
        // Default titles and meanings
        let defaultTitles: [String: String] = [:]
        let defaultMeanings: [String: String] = [:]
        
        guard let defaultTitle = defaultTitles[elementId], let defaultMeaning = defaultMeanings[elementId] else { return nil }
        
        // Priority: pack override > preset > default
        let packTitle = PackOverrides.packTitle(room: "roomName", id: elementId, pack: packContext?.pack)
        let packMeaning = PackOverrides.packMeaning(room: "roomName", id: elementId, pack: packContext?.pack)
        
        let title = packTitle ?? defaultTitle
        let meaning = packMeaning ?? defaultMeaning
        
        return (title, meaning)
    }
}

































