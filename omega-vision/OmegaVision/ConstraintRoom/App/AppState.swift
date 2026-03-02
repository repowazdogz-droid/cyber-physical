import SwiftUI

final class AppState: ObservableObject {
    // User-driven toggles only. No autonomous state changes.
    @Published var showTrustOverlay: Bool = true
}





