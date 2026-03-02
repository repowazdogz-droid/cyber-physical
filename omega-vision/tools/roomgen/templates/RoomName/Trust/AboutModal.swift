import SwiftUI

struct AboutModal: View {
    let preset: ScenePreset
    @Environment(\.dismiss) private var dismiss
    
    private var title: String {
        "ROOM_NAME (V1)"
    }
    
    private var bodyCopy: String {
        "Placeholder: ROOM_NAME reasoning surface description."
    }
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Text(title)
                        .font(.system(size: 22, weight: .bold, design: .rounded))
                    
                    Text("This space shows structure and boundaries — not predictions, not decisions, not advice.")
                        .font(.system(size: 13, weight: .regular, design: .rounded))
                        .opacity(0.85)
                        .padding(.bottom, 4)
                    
                    Text("Purpose")
                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                        .opacity(0.9)
                    Text("This is a spatial reasoning surface. It visualizes structure, constraints, and uncertainty to support human thinking. It does not simulate, control, predict, optimize, or recommend. Nothing moves unless you move the camera.")
                        .font(.system(size: 14, weight: .regular, design: .rounded))
                        .opacity(0.85)
                    Text("This preset")
                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                        .opacity(0.9)
                    Text(bodyCopy)
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

































