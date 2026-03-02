import SwiftUI

struct InspectorPanel: View {
    let item: InspectorItem

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Inspector")
                    .font(.system(size: 15, weight: .semibold, design: .rounded))
                Spacer()
                Text(InspectorCopy.readOnlyLine)
                    .font(.system(size: 11, weight: .regular, design: .rounded))
                    .opacity(0.7)
            }

            Divider().opacity(0.25)

            row("Title", item.title)
            row("Kind", item.kind)
            row("Meaning", item.meaning)
            row("Depends on", item.dependsOn)

            Divider().opacity(0.25)

            Text(InspectorCopy.noAdviceLine)
                .font(.system(size: 12, weight: .regular, design: .rounded))
                .opacity(0.75)

            Text(item.notACommand)
                .font(.system(size: 12, weight: .regular, design: .rounded))
                .opacity(0.75)
        }
        .padding(12)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .frame(width: 320)
    }

    @ViewBuilder
    private func row(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.system(size: 12, weight: .semibold, design: .rounded))
                .opacity(0.85)
            Text(value)
                .font(.system(size: 12, weight: .regular, design: .rounded))
                .opacity(0.9)
        }
    }
}





