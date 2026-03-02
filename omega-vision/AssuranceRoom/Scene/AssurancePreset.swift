import Foundation

struct AssurancePreset: Identifiable {
    let id: String
    let title: String
    let subtitle: String
    let inputTitles: [String: String]  // I1-I4 -> title
    let inputMeanings: [String: String]? // I1-I4 -> meaning (optional)
    let authorityTitles: [String: String]  // A1-A4 -> title
    let authorityMeanings: [String: String]? // A1-A4 -> meaning (optional)
    let outcomeTitles: [String: String]  // S1-S4 -> title
    let outcomeMeanings: [String: String]? // S1-S4 -> meaning (optional)
    let overrideTitles: [String: String]? // OVR1-OVR3 -> title (optional)
    let overrideMeanings: [String: String]? // OVR1-OVR3 -> meaning (optional)
    
    var displayName: String {
        title
    }
}
