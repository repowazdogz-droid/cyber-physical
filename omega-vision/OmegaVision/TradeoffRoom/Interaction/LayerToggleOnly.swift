import SwiftUI

struct LayerToggleOnly: View {
    @Binding var showObjectives: Bool
    @Binding var showConstraints: Bool
    @Binding var showFeasibleRegion: Bool
    @Binding var showTradeoffFront: Bool
    @Binding var showUncertainty: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Layers")
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .opacity(0.9)
            Toggle("Objectives", isOn: $showObjectives)
            Toggle("Constraints", isOn: $showConstraints)
            Toggle("Feasible Region", isOn: $showFeasibleRegion)
            Toggle("Tradeoff Front", isOn: $showTradeoffFront)
            Toggle("Uncertainty", isOn: $showUncertainty)
        }
        .toggleStyle(.switch)
        .font(.system(size: 13, weight: .regular, design: .rounded))
        .padding(12)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

