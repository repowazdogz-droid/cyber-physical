import SwiftUI

struct TrustFooter: View {
    let preset: ScenePreset
    
    private var line1: String {
        "Tradeoff Room — Tradeoffs made visible. Not a forecast. Not a simulator."
    }
    
    private var line2: String {
        TrustCopy.roomTrustLine
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(line1)
                .font(.system(size: 12, weight: .semibold, design: .rounded))
                .opacity(0.9)
            Text(line2)
                .font(.system(size: 12, weight: .regular, design: .rounded))
                .opacity(0.75)
        }
        .padding(12)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

