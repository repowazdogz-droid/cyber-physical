import SwiftUI

struct PresetPicker: View {
    @Binding var preset: ScenePreset
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Presets")
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .opacity(0.9)
            Picker("Preset", selection: $preset) {
                ForEach(ScenePreset.allCases) { p in
                    Text(p.rawValue).tag(p)
                }
            }
            .pickerStyle(.menu)
        }
        .padding(12)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

































