import SwiftUI

struct RCAuditCompare {
    var a: RCAuditModel
    var b: RCAuditModel

    func diffAdded(_ xsA: [String], _ xsB: [String]) -> [String] {
        let setA = Set(xsA)
        return xsB.filter { !setA.contains($0) }
    }

    func diffRemoved(_ xsA: [String], _ xsB: [String]) -> [String] {
        let setB = Set(xsB)
        return xsA.filter { !setB.contains($0) }
    }
}

struct RCAuditCompareView: View {
    let compare: RCAuditCompare

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Compare (A → B)")
                .font(.system(size: 14, weight: .bold, design: .rounded))

            mini("Claim A", compare.a.claimQuoted)
            mini("Claim B", compare.b.claimQuoted)

            diffSection("Detected Issues", compare.a.detectedIssues, compare.b.detectedIssues)
            diffSection("Evidence Present", compare.a.evidencePresent, compare.b.evidencePresent)
            diffSection("Evidence Absent", compare.a.evidenceAbsent, compare.b.evidenceAbsent)
            diffSection("Overreach Prompts", compare.a.overreachCheck, compare.b.overreachCheck)

            Text("Note: This is a structural diff, not a judgment.")
                .font(.system(size: 12, weight: .regular, design: .rounded))
                .opacity(0.65)
        }
        .padding(14)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 18))
        .overlay(
            RoundedRectangle(cornerRadius: 18)
                .strokeBorder(.white.opacity(0.10), lineWidth: 1)
        )
    }

    private func mini(_ title: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title).font(.system(size: 12, weight: .semibold, design: .rounded)).opacity(0.9)
            Text(value.isEmpty ? "—" : value)
                .font(.system(size: 12, weight: .regular, design: .rounded))
                .opacity(0.85)
        }
        .padding(10)
        .background(.black.opacity(0.12))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func diffSection(_ title: String, _ a: [String], _ b: [String]) -> some View {
        let added = compare.diffAdded(a, b)
        let removed = compare.diffRemoved(a, b)

        return VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.system(size: 12, weight: .semibold, design: .rounded))
                .opacity(0.9)

            if added.isEmpty && removed.isEmpty {
                Text("No changes.")
                    .font(.system(size: 12, weight: .regular, design: .rounded))
                    .opacity(0.75)
            } else {
                if !added.isEmpty {
                    Text("Added in B:")
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .opacity(0.75)
                    ForEach(added, id: \.self) { t in
                        Text("• \(t)")
                            .font(.system(size: 12, weight: .regular, design: .rounded))
                            .opacity(0.85)
                    }
                }
                if !removed.isEmpty {
                    Text("Removed from A:")
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .opacity(0.75)
                        .padding(.top, 6)
                    ForEach(removed, id: \.self) { t in
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


































