import SwiftUI

@MainActor
final class ArtifactVault: ObservableObject {
    // Minimal placeholder — in-memory only.
    @Published var artifactsCount: Int = 0
}
