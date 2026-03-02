import Foundation

struct AssumptionPreset: Identifiable {
    let id: String
    let title: String
    let subtitle: String
    let assumptionTitles: [String: String]  // A1-A6 -> title override
    let assumptionMeanings: [String: String]? // A1-A6 -> meaning override (optional)
    
    var displayName: String {
        title
    }
}

