import SwiftUI

struct ResetViewOnly: View {
    let onReset: () -> Void

    var body: some View {
        Button("Reset View") {
            onReset()
        }
        .buttonStyle(.borderedProminent)
        .font(.system(size: 13, weight: .semibold, design: .rounded))
    }
}


































