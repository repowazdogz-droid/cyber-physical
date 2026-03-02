import SwiftUI

struct TrustFooter: View {
    let preset: ScenePreset

    private var line1: String {
        switch preset {
        case .t2CausalMap:
            return "T2 — Conceptual causal map. Not a forecast. Not a simulator."
        case .t3AssumptionSurface:
            return "T3 — Assumptions + uncertainty made visible. No conclusions."
        case .t4TradeoffAtlas:
            return "T4 — Tradeoffs + constraints. No optimization. No 'best'."
        case .t5AssuranceLadder:
            return "T5 — Assurance classes + overrides. Not a procedure."
        }
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

