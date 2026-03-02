import SwiftUI
import PhotosUI
import UIKit

struct RCAuditView: View {
    @State private var selectedItem: PhotosPickerItem?
    @State private var imageData: Data?
    @State private var audit: RCAuditModel = .empty
    @State private var pastedText: String = ""
    @State private var auditA: RCAuditModel = .empty
    @State private var auditB: RCAuditModel = .empty
    @State private var showCompare: Bool = false

    var body: some View {
        HStack(spacing: 16) {

            // LEFT: Image input + preview
            VStack(alignment: .leading, spacing: 12) {
                Text("RC Audit (V2)")
                    .font(.system(size: 18, weight: .bold, design: .rounded))

                Text("Local-only. No network. No conclusions. No persuasion.")
                    .font(.system(size: 13, weight: .regular, design: .rounded))
                    .opacity(0.8)

                PhotosPicker(selection: $selectedItem, matching: .images) {
                    Text("Choose Screenshot")
                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                        .padding(.vertical, 10)
                        .padding(.horizontal, 14)
                        .background(.ultraThinMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                }

                Group {
                    if let imageData, let uiImage = UIImage(data: imageData) {
                        Image(uiImage: uiImage)
                            .resizable()
                            .scaledToFit()
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .strokeBorder(.white.opacity(0.12), lineWidth: 1)
                            )
                    } else {
                        ZStack {
                            RoundedRectangle(cornerRadius: 16)
                                .fill(.ultraThinMaterial)
                            Text("No image selected")
                                .font(.system(size: 13, weight: .regular, design: .rounded))
                                .opacity(0.7)
                        }
                        .frame(height: 260)
                    }
                }

                Text("Paste claim / caption text (manual)")
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .opacity(0.9)
                    .padding(.top, 8)

                TextEditor(text: $pastedText)
                    .font(.system(size: 13, weight: .regular, design: .rounded))
                    .frame(height: 100)
                    .padding(8)
                    .background(.ultraThinMaterial)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .overlay(
                        Group {
                            if pastedText.isEmpty {
                                VStack {
                                    HStack {
                                        Text("Paste claim or caption text here...")
                                            .font(.system(size: 13, weight: .regular, design: .rounded))
                                            .opacity(0.5)
                                            .padding(.leading, 12)
                                            .padding(.top, 16)
                                        Spacer()
                                    }
                                    Spacer()
                                }
                            }
                        }
                    )

                HStack(spacing: 12) {
                    Button("Run RC Audit") {
                        audit = runAudit(from: pastedText)
                    }
                    .buttonStyle(.borderedProminent)
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .disabled(pastedText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

                    Button("Clear") {
                        pastedText = ""
                        audit = .empty
                    }
                    .buttonStyle(.bordered)
                    .font(.system(size: 13, weight: .regular, design: .rounded))
                }

                if !audit.claimQuoted.isEmpty && audit.claimQuoted != "No claim captured yet." {
                    VStack(spacing: 10) {
                        HStack(spacing: 12) {
                            Button("Copy Audit Card") {
                                UIPasteboard.general.string = auditAsText(audit)
                            }
                            .buttonStyle(.bordered)
                            .font(.system(size: 13, weight: .semibold, design: .rounded))

                            ShareLink(item: auditAsText(audit)) {
                                Text("Share Audit Card")
                                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                                    .padding(.vertical, 8)
                                    .padding(.horizontal, 14)
                            }
                            .buttonStyle(.bordered)
                        }

                        HStack(spacing: 12) {
                            Button("Save as A") {
                                auditA = audit
                            }
                            .buttonStyle(.bordered)
                            .font(.system(size: 13, weight: .regular, design: .rounded))

                            Button("Save as B") {
                                auditB = audit
                            }
                            .buttonStyle(.bordered)
                            .font(.system(size: 13, weight: .regular, design: .rounded))

                            Button("Compare A→B") {
                                showCompare = true
                            }
                            .buttonStyle(.bordered)
                            .font(.system(size: 13, weight: .semibold, design: .rounded))
                            .disabled(auditA.claimQuoted.isEmpty || auditA.claimQuoted == "No claim captured yet." || auditB.claimQuoted.isEmpty || auditB.claimQuoted == "No claim captured yet.")
                        }
                    }
                }

                Spacer()
            }
            .frame(maxWidth: 520)
            .padding(18)

            // RIGHT: Structured audit (stub)
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    section("1) Claim (quoted)") {
                        Text(audit.claimQuoted).opacity(0.85)
                    }

                    section("2) Detected Claim Issues") {
                        bullets(audit.detectedIssues, empty: "No issues captured yet.")
                    }

                    section("3) Evidence Present (explicit)") {
                        bullets(audit.evidencePresent, empty: "None extracted yet.")
                    }

                    section("4) Evidence Absent") {
                        bullets(audit.evidenceAbsent, empty: "None flagged yet.")
                    }

                    section("5) Uncertainty Boundary") {
                        Text(audit.uncertaintyBoundary).opacity(0.85)
                    }

                    section("6) Overreach Check") {
                        bullets(audit.overreachCheck, empty: "No checks run yet.")
                    }

                    section("7) Safe Next Questions") {
                        bullets(audit.safeNextQuestions, empty: "No questions proposed yet.")
                    }

                    Text("Trust contract: This output is descriptive and incomplete until analysis is implemented.")
                        .font(.system(size: 12, weight: .regular, design: .rounded))
                        .opacity(0.65)
                        .padding(.top, 8)

                    Divider().opacity(0.25)
                        .padding(.vertical, 8)

                    Text("Audit Card Preview")
                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                        .opacity(0.9)
                        .padding(.bottom, 4)

                    RCAuditCard(audit: audit)
                }
                .padding(18)
            }
            .frame(maxWidth: 560)
            .background(.ultraThinMaterial)
            .clipShape(RoundedRectangle(cornerRadius: 18))
            .padding(.trailing, 18)
        }
        .task(id: selectedItem) {
            guard let selectedItem else { return }
            if let data = try? await selectedItem.loadTransferable(type: Data.self) {
                imageData = data
                // Reset audit when new image selected
                audit = .empty
            }
        }
        .sheet(isPresented: $showCompare) {
            ScrollView {
                RCAuditCompareView(compare: RCAuditCompare(a: auditA, b: auditB))
                    .padding(18)
            }
        }
    }

    private func runAudit(from text: String) -> RCAuditModel {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty {
            return .empty
        }

        // Quote exactly (no reinterpretation)
        var out = RCAuditModel.empty
        out.claimQuoted = trimmed

        // Heuristic signals (local, illustrative)
        let lower = trimmed.lowercased()

        // Detected claim issues
        var issues: [String] = []
        if trimmed.count < 12 { issues.append("Claim is too short to audit reliably (likely missing context).") }
        if trimmed.contains("?") { issues.append("Input appears to be a question, not a claim. Audit may be limited.") }
        if lower.contains("always") || lower.contains("never") { issues.append("Contains absolute language (always/never) — often overstates evidence.") }
        if lower.contains("proves") || lower.contains("proven") || lower.contains("guarantee") { issues.append("Uses strong certainty words (prove/guarantee) — requires strong evidence.") }
        if lower.contains("causes") || lower.contains("caused by") { issues.append("Causal wording detected (causes) — check for causal evidence vs correlation.") }
        if lower.contains("best") || lower.contains("optimal") || lower.contains("everyone should") { issues.append("Normative/optimization language detected — this tool will not recommend or prescribe.") }
        out.detectedIssues = issues

        // Evidence present vs absent (strict: only what user explicitly stated)
        // We cannot infer evidence from tone. Only flag absence prompts.
        var present: [String] = []
        var absent: [String] = []

        // Look for explicit anchors
        if lower.contains("data") || lower.contains("dataset") { present.append("Mentions data, but details (source/size) not provided here.") }
        if lower.contains("study") || lower.contains("paper") || lower.contains("trial") { present.append("Mentions a study/paper/trial, but citation not provided here.") }
        if lower.contains("%") || lower.range(of: #"\d+\s?%"#, options: .regularExpression) != nil { present.append("Contains a quantitative % figure (context/source not provided here).") }
        if lower.range(of: #"\b(n=|sample|participants|subjects)\b"#, options: .regularExpression) != nil { present.append("Mentions sample size concept (specific n not provided here).") }

        // Absent prompts (only if claim is strong)
        let strongClaim = lower.contains("prove") || lower.contains("guarantee") || lower.contains("always") || lower.contains("never") || lower.contains("causes")
        if strongClaim {
            absent.append("No explicit source/citation included in the pasted text.")
            absent.append("No stated measurement method or study design in the pasted text.")
        } else {
            absent.append("No explicit source/citation included in the pasted text.")
        }

        out.evidencePresent = present
        out.evidenceAbsent = absent

        // Uncertainty boundary (honest, non-concluding)
        out.uncertaintyBoundary = "This audit is bounded to the pasted text only. It does not validate external sources or infer missing context."

        // Overreach check (questions, not conclusions)
        var overreach: [String] = []
        if lower.contains("caus") {
            overreach.append("If causal: what design supports causality (randomization, controls, identification strategy)?")
        }
        if strongClaim {
            overreach.append("If certainty is high: what specific evidence supports that level of confidence?")
        }
        if lower.contains("new") || lower.contains("first") || lower.contains("breakthrough") {
            overreach.append("If novelty is claimed: compared to what baseline or prior work?")
        }
        out.overreachCheck = overreach

        // Safe next questions (non-persuasive)
        out.safeNextQuestions = [
            "What is the exact claim scope (where/when/for whom)?",
            "What evidence is explicitly available (source, method, sample size)?",
            "What would change your confidence up or down?",
            "What is the strongest alternative explanation?"
        ]

        return out
    }

    private func section(_ title: String, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .opacity(0.9)
            content()
                .font(.system(size: 13, weight: .regular, design: .rounded))
        }
        .padding(12)
        .background(.black.opacity(0.12))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func bullets(_ items: [String], empty: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            if items.isEmpty {
                Text(empty).opacity(0.75)
            } else {
                ForEach(items, id: \.self) { t in
                    Text("• \(t)").opacity(0.85)
                }
            }
        }
    }

    private func auditAsText(_ a: RCAuditModel) -> String {
        func list(_ title: String, _ xs: [String]) -> String {
            let body = xs.isEmpty ? "—" : xs.map { "• \($0)" }.joined(separator: "\n")
            return "\(title):\n\(body)\n"
        }

        return """
OmegaRC — Audit Card
Descriptive, bounded to provided text. No conclusions. No persuasion.

Claim (quoted):
\(a.claimQuoted)

\(list("Detected Claim Issues", a.detectedIssues))
\(list("Evidence Present (explicit)", a.evidencePresent))
\(list("Evidence Absent", a.evidenceAbsent))

Uncertainty Boundary:
\(a.uncertaintyBoundary)

\(list("Overreach Check", a.overreachCheck))
\(list("Safe Next Questions", a.safeNextQuestions))

Human-led. Non-autonomous. Evidence-first reasoning hygiene.
"""
    }
}

