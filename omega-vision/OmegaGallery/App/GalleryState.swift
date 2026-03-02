import SwiftUI

@MainActor
final class GalleryState: ObservableObject {
    // Minimal state to get the app running.
    @Published var statusText: String = "OmegaGallery (minimal) — running"
}
