import SwiftUI

struct RCAuditCard: View {
    let audit: RCAuditModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            header

            block("Claim (quoted)", audit.claimQuoted)

            blockList("Detected Claim Issues", audit.detectedIssues, empty: "None detected from pasted text alone.")
            blockList("Evidence Present (explicit)", audit.evidencePresent, empty: "None explicitly stated.")
            blockList("Evidence Absent", audit.evidenceAbsent, empty: "None flagged.")
            block("Uncertainty Boundary", audit.uncertaintyBoundary)
            blockList("Overreach Check", audit.overreachCheck, empty: "No overreach prompts triggered.")
            blockList("Safe Next Questions", audit.safeNextQuestions, empty: "—")

            footer
        }
        .padding(16)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 18))
        .overlay(
            RoundedRectangle(cornerRadius: 18)
                .strokeBorder(.white.opacity(0.10), lineWidth: 1)
        )
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("OmegaRC — Audit Card")
                .font(.system(size: 16, weight: .bold, design: .rounded))
            Text("Descriptive, bounded to provided text. No conclusions. No persuasion.")
                .font(.system(size: 12, weight: .regular, design: .rounded))
                .opacity(0.75)
        }
    }

    private var footer: some View {
        Text("Human-led. Non-autonomous. Evidence-first reasoning hygiene.")
            .font(.system(size: 12, weight: .regular, design: .rounded))
            .opacity(0.65)
            .padding(.top, 4)
    }

    private func block(_ title: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.system(size: 12, weight: .semibold, design: .rounded))
                .opacity(0.9)
            Text(value.isEmpty ? "—" : value)
                .font(.system(size: 12, weight: .regular, design: .rounded))
                .opacity(0.85)
        }
        .padding(10)
        .background(.black.opacity(0.12))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func blockList(_ title: String, _ items: [String], empty: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.system(size: 12, weight: .semibold, design: .rounded))
                .opacity(0.9)
            if items.isEmpty {
                Text(empty)
                    .font(.system(size: 12, weight: .regular, design: .rounded))
                    .opacity(0.75)
            } else {
                VStack(alignment: .leading, spacing: 4) {
                    ForEach(items, id: \.self) { t in
                        Text("• \(t)")
                            .font(.system(size: 12, weight: .regular, design: .rounded))
                            .opacity(0.85)
                    }
                }
            }
        }
        .padding(10)
        .background(.black.opacity(0.12))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }
}





