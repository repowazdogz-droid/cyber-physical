import SwiftUI

struct LayerToggleOnly: View {
    @Binding var showStructure: Bool
    @Binding var showLinks: Bool
    @Binding var showDisallowedLinks: Bool
    @Binding var showConstraints: Bool
    @Binding var showAssumptions: Bool
    @Binding var showUncertainty: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Layers")
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .opacity(0.9)
            Toggle("Nodes", isOn: $showStructure)
            Toggle("Links", isOn: $showLinks)
            Toggle("Disallowed Links", isOn: $showDisallowedLinks)
            Toggle("Constraints", isOn: $showConstraints)
            Toggle("Assumptions", isOn: $showAssumptions)
            Toggle("Uncertainty", isOn: $showUncertainty)
        }
        .toggleStyle(.switch)
        .font(.system(size: 13, weight: .regular, design: .rounded))
        .padding(12)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

