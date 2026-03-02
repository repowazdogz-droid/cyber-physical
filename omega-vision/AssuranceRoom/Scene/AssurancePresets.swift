import Foundation

enum AssurancePresets {
    static let all: [AssurancePreset] = [
        uavSafeLanding,
        clinicalRobotics,
        researchAcademia
    ]
    
    static let uavSafeLanding = AssurancePreset(
        id: "uav-safe-landing",
        title: "UAV Safe Landing",
        subtitle: "UAV safe landing assurances",
        inputTitles: [
            "I1": "Fault Effect",
            "I2": "Detection Confidence",
            "I3": "Remaining Authority",
            "I4": "Time-to-Criticality"
        ],
        inputMeanings: [
            "I1": "What degraded or failed. Illustrates degraded input, not a prescription.",
            "I2": "Confidence in detection. Illustrates uncertainty, not a guarantee.",
            "I3": "Remaining control authority. Illustrates capability bounds, not a command.",
            "I4": "Time-to-criticality estimate. Illustrates urgency bounds, not a deadline."
        ],
        authorityTitles: [
            "A1": "Near-nominal",
            "A2": "Reduced",
            "A3": "Marginal",
            "A4": "Uncontrolled"
        ],
        authorityMeanings: [
            "A1": "Near-nominal authority band. Illustrates remaining control capability, not a guarantee.",
            "A2": "Reduced authority band. Illustrates degraded capability, not a recommendation.",
            "A3": "Marginal authority band. Illustrates limited capability, not a command.",
            "A4": "Uncontrolled authority band. Illustrates loss of control, not a prediction."
        ],
        outcomeTitles: [
            "S1": "Stabilize & Assess",
            "S2": "Controlled Descent",
            "S3": "Degraded Landing",
            "S4": "Impact Mitigation / FTS"
        ],
        outcomeMeanings: [
            "S1": "Bounded outcome class: stabilize and assess. Illustrates what can be guaranteed, not a procedure.",
            "S2": "Bounded outcome class: controlled descent. Illustrates what can be guaranteed, not a procedure.",
            "S3": "Bounded outcome class: degraded landing. Illustrates what can be guaranteed, not a procedure.",
            "S4": "Bounded outcome class: impact mitigation or FTS. Illustrates what can be guaranteed, not a procedure."
        ],
        overrideTitles: [
            "OVR1": "Crowd/People Present",
            "OVR2": "Unperceivable",
            "OVR3": "Ethics Override"
        ],
        overrideMeanings: [
            "OVR1": "Hard override constraint: crowd/people present disallows landing attempt. Illustrates an ethical boundary, not advice.",
            "OVR2": "Hard override constraint: unperceivable conditions restrict outcomes. Illustrates a capability boundary, not a recommendation.",
            "OVR3": "Hard override constraint: ethics override capability. Illustrates a boundary, not a command."
        ]
    )
    
    static let clinicalRobotics = AssurancePreset(
        id: "clinical-robotics",
        title: "Clinical Robotics",
        subtitle: "Clinical robotics safety assurances",
        inputTitles: [
            "I1": "Patient Risk Level",
            "I2": "Detection Confidence",
            "I3": "Remaining Control",
            "I4": "Time-to-Criticality"
        ],
        inputMeanings: [
            "I1": "Patient risk level under degradation. Illustrates degraded input, not a prescription.",
            "I2": "Confidence in detection. Illustrates uncertainty, not a guarantee.",
            "I3": "Remaining clinical control authority. Illustrates capability bounds, not a command.",
            "I4": "Time-to-criticality estimate. Illustrates urgency bounds, not a deadline."
        ],
        authorityTitles: [
            "A1": "Near-nominal",
            "A2": "Reduced",
            "A3": "Marginal",
            "A4": "Uncontrolled"
        ],
        authorityMeanings: [
            "A1": "Near-nominal authority band. Illustrates remaining control capability, not a guarantee.",
            "A2": "Reduced authority band. Illustrates degraded capability, not a recommendation.",
            "A3": "Marginal authority band. Illustrates limited capability, not a command.",
            "A4": "Uncontrolled authority band. Illustrates loss of control, not a prediction."
        ],
        outcomeTitles: [
            "S1": "Stabilize & Assess",
            "S2": "Controlled Withdrawal",
            "S3": "Degraded Operation",
            "S4": "Safety Stop / Override"
        ],
        outcomeMeanings: [
            "S1": "Bounded outcome class: stabilize and assess. Illustrates what can be guaranteed, not a procedure.",
            "S2": "Bounded outcome class: controlled withdrawal. Illustrates what can be guaranteed, not a procedure.",
            "S3": "Bounded outcome class: degraded operation. Illustrates what can be guaranteed, not a procedure.",
            "S4": "Bounded outcome class: safety stop or override. Illustrates what can be guaranteed, not a procedure."
        ],
        overrideTitles: [
            "OVR1": "Consent/Patient Override",
            "OVR2": "Unperceivable",
            "OVR3": "Ethics Override"
        ],
        overrideMeanings: [
            "OVR1": "Hard override constraint: consent/patient override disallows certain actions. Illustrates an ethical boundary, not advice.",
            "OVR2": "Hard override constraint: unperceivable conditions restrict outcomes. Illustrates a capability boundary, not a recommendation.",
            "OVR3": "Hard override constraint: ethics override capability. Illustrates a boundary, not a command."
        ]
    )
    
    static let researchAcademia = AssurancePreset(
        id: "research-academia",
        title: "Research / Academia",
        subtitle: "Research assurance guarantees",
        inputTitles: [
            "I1": "Claim Degradation",
            "I2": "Evidence Confidence",
            "I3": "Remaining Validity",
            "I4": "Time-to-Invalidity"
        ],
        inputMeanings: [
            "I1": "What degraded or failed in the claim. Illustrates degraded input, not a prescription.",
            "I2": "Confidence in evidence. Illustrates uncertainty, not a guarantee.",
            "I3": "Remaining validity authority. Illustrates capability bounds, not a command.",
            "I4": "Time-to-invalidity estimate. Illustrates urgency bounds, not a deadline."
        ],
        authorityTitles: [
            "A1": "Near-nominal",
            "A2": "Reduced",
            "A3": "Marginal",
            "A4": "Uncontrolled"
        ],
        authorityMeanings: [
            "A1": "Near-nominal authority band. Illustrates remaining validity, not a guarantee.",
            "A2": "Reduced authority band. Illustrates degraded validity, not a recommendation.",
            "A3": "Marginal authority band. Illustrates limited validity, not a command.",
            "A4": "Uncontrolled authority band. Illustrates loss of validity, not a prediction."
        ],
        outcomeTitles: [
            "S1": "Stabilize & Assess",
            "S2": "Controlled Retraction",
            "S3": "Degraded Claim",
            "S4": "Withdrawal / Correction"
        ],
        outcomeMeanings: [
            "S1": "Bounded outcome class: stabilize and assess. Illustrates what can be guaranteed, not a procedure.",
            "S2": "Bounded outcome class: controlled retraction. Illustrates what can be guaranteed, not a procedure.",
            "S3": "Bounded outcome class: degraded claim. Illustrates what can be guaranteed, not a procedure.",
            "S4": "Bounded outcome class: withdrawal or correction. Illustrates what can be guaranteed, not a procedure."
        ],
        overrideTitles: [
            "OVR1": "Ethics/Consent Override",
            "OVR2": "Unverifiable",
            "OVR3": "Ethics Override"
        ],
        overrideMeanings: [
            "OVR1": "Hard override constraint: ethics/consent override disallows certain claims. Illustrates an ethical boundary, not advice.",
            "OVR2": "Hard override constraint: unverifiable conditions restrict outcomes. Illustrates a capability boundary, not a recommendation.",
            "OVR3": "Hard override constraint: ethics override capability. Illustrates a boundary, not a command."
        ]
    )
    
    static func preset(id: String) -> AssurancePreset? {
        return all.first { $0.id == id }
    }
}
