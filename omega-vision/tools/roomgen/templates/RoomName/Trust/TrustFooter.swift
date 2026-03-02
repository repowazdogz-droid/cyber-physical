import SwiftUI

struct TrustFooter: View {
    let preset: ScenePreset
    
    private var line1: String {
        "ROOM_NAME — Conceptual reasoning surface. Not a forecast. Not a simulator."
    }
    
    private var line2: String {
        "Human-led. Non-autonomous. Visual reasoning only. Not a simulation."
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

































