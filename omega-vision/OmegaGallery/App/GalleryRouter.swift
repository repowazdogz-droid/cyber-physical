import SwiftUI

struct GalleryRouter: View {
    @EnvironmentObject private var state: GalleryState
    @EnvironmentObject private var vault: ArtifactVault

    var body: some View {
        VStack(spacing: 16) {
            Text(state.statusText)
                .font(.title)

            Text("Artifacts: \(vault.artifactsCount)")
                .font(.headline)

            Text("Next: wire in real GalleryView / Rooms once the full source is restored.")
                .font(.subheadline)
                .multilineTextAlignment(.center)
                .opacity(0.8)
        }
        .padding()
    }
}
