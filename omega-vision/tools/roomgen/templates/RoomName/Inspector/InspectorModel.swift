import Foundation

struct InspectorItem: Identifiable {
    let id = UUID()
    let title: String
    let kind: String
    let meaning: String
    let dependsOn: String
    let notACommand: String
}

enum InspectorDefaults {
    static let empty = InspectorItem(
        title: "Nothing selected",
        kind: "—",
        meaning: "Tap an element to view neutral metadata.",
        dependsOn: "—",
        notACommand: SelectionSemantics.notACommand
    )
}

