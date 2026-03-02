import Foundation

struct CausalPreset: Identifiable {
    let id: String
    let title: String
    let subtitle: String
    let nodeTitles: [String: String]  // nodeId -> title override
    let nodeMeanings: [String: String]? // nodeId -> meaning override (optional)
    
    var displayName: String {
        title
    }
}





