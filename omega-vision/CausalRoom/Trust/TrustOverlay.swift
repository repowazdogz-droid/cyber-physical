import SwiftUI

struct TrustOverlay: View {
    var body: some View {
        VStack(spacing: 6) {
            Text(TrustContract.title)
                .font(.system(size: 22, weight: .semibold, design: .rounded))
            Text(TrustContract.subtitle)
                .font(.system(size: 14, weight: .regular, design: .rounded))
                .opacity(0.85)
            Text(TrustContract.footer)
                .font(.system(size: 13, weight: .regular, design: .rounded))
                .opacity(0.8)
        }
        .padding(14)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .padding(18)
    }
}


































