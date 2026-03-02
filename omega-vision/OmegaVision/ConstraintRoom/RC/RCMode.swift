import Foundation

enum RCMode: String, CaseIterable, Identifiable {
    case gallery = "Gallery"
    case rcAudit = "RC Audit"

    var id: String { rawValue }
}





