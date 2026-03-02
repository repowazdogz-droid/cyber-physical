import SwiftUI
import Foundation

struct PackContext {
    let pack: PresetPack?
}

private struct PackContextKey: EnvironmentKey {
    static let defaultValue: PackContext = PackContext(pack: nil)
}

extension EnvironmentValues {
    var packContext: PackContext {
        get { self[PackContextKey.self] }
        set { self[PackContextKey.self] = newValue }
    }
}


































