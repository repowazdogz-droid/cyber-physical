import Foundation

enum InspectorRules {
    // Hard language bans (simple guardrails).
    static let bannedAdviceWords: [String] = [
        "should", "must", "recommend", "best", "optimal", "do this", "therefore", "conclude"
    ]

    static func sanitize(_ text: String) -> String {
        var out = text
        for w in bannedAdviceWords {
            if out.lowercased().contains(w) {
                out = out.replacingOccurrences(of: w, with: "—", options: [.caseInsensitive])
            }
        }
        return out
    }
}


































