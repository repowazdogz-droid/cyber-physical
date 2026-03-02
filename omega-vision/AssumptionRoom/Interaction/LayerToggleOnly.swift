import SwiftUI

struct LayerToggleOnly: View {
    @Binding var showAssumptions: Bool
    @Binding var showConflicts: Bool
    @Binding var showUnsupported: Bool
    @Binding var showUncertainty: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Layers")
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .opacity(0.9)
            Toggle("Assumptions", isOn: $showAssumptions)
            Toggle("Conflicts", isOn: $showConflicts)
            Toggle("Unsupported", isOn: $showUnsupported)
            Toggle("Uncertainty", isOn: $showUncertainty)
        }
        .toggleStyle(.switch)
        .font(.system(size: 13, weight: .regular, design: .rounded))
        .padding(12)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

