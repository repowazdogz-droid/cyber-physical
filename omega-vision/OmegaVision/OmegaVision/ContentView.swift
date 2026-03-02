import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack(spacing: 16) {
            Text("OmegaVision")
                .font(.largeTitle)
            Text("Build OK (no RealityKitContent).")
                .font(.headline)
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
