import SwiftUI

struct AboutModal: View {
    let preset: ScenePreset
    @Environment(\.dismiss) private var dismiss
    
    private var title: String {
        "Tradeoff Room (V1)"
    }
    
    private var bodyCopy: String {
        "Placeholder: Tradeoff reasoning surface description."
    }
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Text(title)
                        .font(.system(size: 22, weight: .bold, design: .rounded))
                    
                    Text("This space shows tradeoffs and boundaries — not optimization, not recommendations, not decisions.")
                        .font(.system(size: 13, weight: .regular, design: .rounded))
                        .opacity(0.85)
                        .padding(.bottom, 4)
                    
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
                    Text(preset.tradeoffPreset.subtitle)
                        .font(.system(size: 14, weight: .regular, design: .rounded))
                        .opacity(0.85)
                }
                .padding(18)
            }
            .navigationTitle("About")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

