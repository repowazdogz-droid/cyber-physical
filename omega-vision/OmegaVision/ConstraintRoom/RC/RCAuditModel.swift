import Foundation

struct RCAuditModel {
    var claimQuoted: String
    var detectedIssues: [String]
    var evidencePresent: [String]
    var evidenceAbsent: [String]
    var uncertaintyBoundary: String
    var overreachCheck: [String]
    var safeNextQuestions: [String]

    static var empty: RCAuditModel {
        .init(
            claimQuoted: "No claim captured yet.",
            detectedIssues: [],
            evidencePresent: [],
            evidenceAbsent: [],
            uncertaintyBoundary: "No uncertainty boundary yet.",
            overreachCheck: [],
            safeNextQuestions: []
        )
    }
}





