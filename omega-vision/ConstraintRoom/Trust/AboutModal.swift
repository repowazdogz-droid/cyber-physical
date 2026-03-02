import SwiftUI

struct AboutModal: View {
    let preset: ScenePreset
    @Environment(\.dismiss) private var dismiss

    private var title: String { "ConstraintRoom (V1)" }

    private var bodyCopy: String {
        switch preset {
        case .t2CausalMap:
            return """
This is a conceptual causal surface.

It shows: nodes, links, uncertainty, and disallowed claims — as a visual aid.

It does not simulate, predict outcomes, or recommend actions.
"""
        case .t3AssumptionSurface:
            return """
This is an assumption surface.

It shows: what the reasoning depends on, where assumptions conflict, and where knowledge is missing.

It does not conclude, decide, or prescribe.
"""
        case .t4TradeoffAtlas:
            return """
This is a tradeoff atlas.

It shows: objectives, constraints, and a conceptual feasible region.

It does not optimize, choose "best", or generate recommendations.
"""
        case .t5AssuranceLadder:
            return """
This is an assurance ladder.

It shows: bounded outcome classes and hard overrides.

It is not a procedure, checklist, or certification claim.
"""
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Text(title)
                        .font(.system(size: 22, weight: .bold, design: .rounded))

                    Text("Purpose")
                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                        .opacity(0.9)
                    Text(TrustCopy.aboutCore)
                        .font(.system(size: 14, weight: .regular, design: .rounded))
                        .opacity(0.85)
                    Text("This room is an Inspectable Description. It visualizes structure and boundaries without executing or simulating any system behavior.")
                        .font(.system(size: 14, weight: .regular, design: .rounded))
                        .opacity(0.85)
                        .padding(.top, 4)

                    Text("This preset")
                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                        .opacity(0.9)
                    Text(bodyCopy)
                        .font(.system(size: 14, weight: .regular, design: .rounded))
                        .opacity(0.85)

                    Text("Interaction contract (V1)")
                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                        .opacity(0.9)

                    VStack(alignment: .leading, spacing: 8) {
                        Text("• Toggle layers")
                        Text("• Tap to inspect metadata")
                        Text("• Reset view (camera/state only)")
                    }
                    .font(.system(size: 14, weight: .regular, design: .rounded))
                    .opacity(0.85)

                    Text("Hard limits")
                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                        .opacity(0.9)

                    VStack(alignment: .leading, spacing: 8) {
                        Text("• No simulation / physics")
                        Text("• No control / manipulation")
                        Text("• No recommendations or 'best'")
                        Text("• No operational procedures")
                    }
                    .font(.system(size: 14, weight: .regular, design: .rounded))
                    .opacity(0.85)
                }
                .padding(18)
            }
            .navigationTitle("About")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}

