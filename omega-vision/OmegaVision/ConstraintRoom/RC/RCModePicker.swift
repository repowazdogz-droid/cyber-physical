import SwiftUI

struct RCModePicker: View {
    @Binding var mode: RCMode

    var body: some View {
        Picker("Mode", selection: $mode) {
            ForEach(RCMode.allCases) { m in
                Text(m.rawValue).tag(m)
            }
        }
        .pickerStyle(.segmented)
        .frame(width: 360)
    }
}





