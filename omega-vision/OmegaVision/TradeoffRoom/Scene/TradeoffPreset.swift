import Foundation

struct TradeoffPreset: Identifiable {
    let id: String
    let title: String
    let subtitle: String
    let objectiveTitles: [String: String]  // O1-O3 -> title override
    let objectiveMeanings: [String: String]? // O1-O3 -> meaning override (optional)
    let constraintTitles: [String: String]  // K1-K3 -> title override
    let constraintMeanings: [String: String]? // K1-K3 -> meaning override (optional)
    let frontTitles: [String: String]? // T1-T7 -> title override (optional)
    let frontMeanings: [String: String]? // T1-T7 -> meaning override (optional)
    
    var displayName: String {
        title
    }
}

