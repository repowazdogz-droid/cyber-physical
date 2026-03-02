import SwiftUI

struct LayerToggleOnly: View {
    @Binding var showInputs: Bool
    @Binding var showAuthority: Bool
    @Binding var showOutcomes: Bool
    @Binding var showOverrides: Bool
    @Binding var showTrace: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Layers")
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .opacity(0.9)
            Toggle("Inputs", isOn: $showInputs)
            Toggle("Authority", isOn: $showAuthority)
            Toggle("Outcomes", isOn: $showOutcomes)
            Toggle("Overrides", isOn: $showOverrides)
            Toggle("Trace", isOn: $showTrace)
        }
        .toggleStyle(.switch)
        .font(.system(size: 13, weight: .regular, design: .rounded))
        .padding(12)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

