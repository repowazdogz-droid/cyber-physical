"""
Spine surgery clinical constraints — machine-checkable predicates for clinical case data.
Uses the same interface as formal_constraints.py (FormalConstraint, ConstraintCheckResult, CheckResult).
"""

import re
from typing import Dict, List, Any, Optional

from .formal_constraints import (
    FormalConstraint,
    ConstraintCheckResult,
    CheckResult,
)


def _parse_duration_weeks(s: str) -> Optional[float]:
    """Parse symptom_duration string to approximate weeks. Returns None if unparseable."""
    if not s or not isinstance(s, str):
        return None
    s_lower = s.lower().strip()
    # Try explicit pattern first: "18 months", "6 weeks", "2 years"
    m = re.search(r"(\d+(?:\.\d+)?)\s*(month|year|week)s?", s_lower)
    if m:
        try:
            val = float(m.group(1))
            unit = m.group(2).lower()
            if "month" in unit:
                return val * (52 / 12)
            if "year" in unit:
                return val * 52
            if "week" in unit:
                return val
        except (ValueError, TypeError):
            pass
    # Fallback: look for any number and assume months if "month" appears in string
    num = re.search(r"(\d+(?:\.\d+)?)", s_lower)
    if num:
        try:
            val = float(num.group(1))
            if "month" in s_lower:
                return val * (52 / 12)
            if "year" in s_lower:
                return val * 52
            if "week" in s_lower:
                return val
            return val * (52 / 12)  # default assume months
        except (ValueError, TypeError):
            pass
    return None


def _parse_bmi(comorbidities: List[str]) -> Optional[float]:
    """Try to extract BMI from comorbidities list (e.g. 'BMI 31', 'BMI 32')."""
    for c in comorbidities or []:
        c = str(c).strip()
        m = re.search(r"bmi\s*[:\s]*(\d+(?:\.\d+)?)", c, re.I)
        if m:
            try:
                return float(m.group(1))
            except ValueError:
                pass
    return None


def _keyword_present_not_negated(text: str, keywords: List[str]) -> List[str]:
    """
    Check if keywords are present in text but NOT preceded by negation phrases.
    Returns list of keywords that are genuinely present (not negated).

    Handles patterns like:
    - "No bladder symptoms" → bladder is negated
    - "no bowel dysfunction" → bowel is negated
    - "denies bladder" → bladder is negated
    - "without bladder" → bladder is negated
    - "not experiencing bowel" → bowel is negated
    - "bladder dysfunction present" → bladder is NOT negated (genuine finding)
    - "reports bladder retention" → bladder is NOT negated
    """
    text_lower = (text or "").lower()
    found: List[str] = []

    negation_phrases = [
        "no ", "no\n", "not ", "denies ", "denied ", "without ",
        "absent", "negative for ", "rules out ", "ruled out ",
        "no evidence of ", "not experiencing ", "not reporting ",
        "does not have ", "doesn't have ", "has no ",
        "nil ", "none ", "no history of "
    ]

    for keyword in keywords:
        keyword_lower = keyword.lower()
        start = 0
        keyword_genuinely_present = False

        while True:
            idx = text_lower.find(keyword_lower, start)
            if idx == -1:
                break

            context_start = max(0, idx - 40)
            preceding_context = text_lower[context_start:idx].strip()

            is_negated = False
            for neg in negation_phrases:
                neg_clean = neg.strip()
                if preceding_context.endswith(neg_clean) or preceding_context.endswith(neg_clean + " "):
                    is_negated = True
                    break
                last_clause = preceding_context.split(".")[-1].split(",")[-1].strip()
                if last_clause.startswith(neg_clean) or f" {neg_clean}" in f" {last_clause}":
                    is_negated = True
                    break

            if not is_negated:
                keyword_genuinely_present = True
                break

            start = idx + 1

        if keyword_genuinely_present:
            found.append(keyword)

    return found


def _has_red_flag_indicators(symptoms: str) -> bool:
    """True if symptoms suggest red flags (progressive deficit / cauda). Uses negation-aware matching."""
    keywords = [
        "progressive", "weakness", "motor deficit", "foot drop",
        "cauda equina", "bladder", "bowel", "saddle", "bilateral",
    ]
    return len(_keyword_present_not_negated(symptoms or "", keywords)) > 0


def _get_comorbidities_list(design_data: Dict[str, Any]) -> List[str]:
    """Normalize comorbidities to list of strings."""
    c = design_data.get("comorbidities")
    if isinstance(c, list):
        return [str(x).strip() for x in c if x]
    if isinstance(c, str) and c.strip():
        return [x.strip() for x in re.split(r"[,;\n]+", c) if x.strip()]
    return []


def _get_prior_treatments_list(design_data: Dict[str, Any]) -> List[str]:
    """Normalize prior_treatments to list of strings."""
    p = design_data.get("prior_treatments")
    if isinstance(p, list):
        return [str(x).strip() for x in p if x]
    if isinstance(p, str) and p.strip():
        return [x.strip() for x in re.split(r"[,;\n]+", p) if x.strip()]
    return []


# --- Red flag constraints ---


class ProgressiveNeurologicalDeficitConstraint(FormalConstraint):
    def __init__(self):
        super().__init__(
            constraint_id="CLIN_001",
            name="progressive_neurological_deficit",
            description="Screen for progressive neurological deficit indicators",
        )
        self.keywords = [
            "weakness",
            "progressive",
            "motor deficit",
            "foot drop",
            "cauda equina",
            "bladder",
            "bowel",
            "saddle anaesthesia",
            "saddle anesthesia",
        ]

    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        symptoms = design_data.get("presenting_symptoms") or ""
        matched = _keyword_present_not_negated(symptoms, self.keywords)
        if matched:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_VIOLATED,
                evidence=f"Progressive neurological deficit detected: {', '.join(matched)}. Urgent surgical evaluation required.",
                confidence=0.9,
            )
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED,
            evidence="No progressive neurological deficit indicators found",
            confidence=0.85,
        )


class CaudaEquinaScreenConstraint(FormalConstraint):
    def __init__(self):
        super().__init__(
            constraint_id="CLIN_002",
            name="cauda_equina_screen",
            description="Screen for cauda equina syndrome indicators",
        )
        self.keywords = [
            "cauda equina",
            "bilateral",
            "bladder dysfunction",
            "bowel dysfunction",
            "saddle",
            "perineal",
            "urinary retention",
            "bladder",
            "bowel",
        ]

    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        symptoms = design_data.get("presenting_symptoms") or ""
        imaging = design_data.get("imaging_summary") or ""
        combined = symptoms + " " + imaging
        matched = _keyword_present_not_negated(combined, self.keywords)
        if matched:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_VIOLATED,
                evidence=f"Cauda equina indicators present: {', '.join(matched)}. Emergency assessment required.",
                confidence=0.9,
            )
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED,
            evidence="No cauda equina indicators",
            confidence=0.85,
        )


class ConservativeTreatmentDurationConstraint(FormalConstraint):
    def __init__(self):
        super().__init__(
            constraint_id="CLIN_003",
            name="conservative_treatment_duration",
            description="Minimum conservative treatment duration before surgical consideration",
        )

    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        duration_str = design_data.get("symptom_duration") or ""
        weeks = _parse_duration_weeks(duration_str)
        prior = _get_prior_treatments_list(design_data)
        prior_lower = " ".join(prior).lower()
        has_conservative = any(
            kw in prior_lower
            for kw in ["physiotherapy", "pt", "physical therapy", "exercise", "medication"]
        )
        symptoms = (design_data.get("presenting_symptoms") or "").lower()
        red_flags = _has_red_flag_indicators(symptoms)

        if weeks is not None and weeks < 6 and not red_flags:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_VIOLATED,
                value=weeks,
                threshold=6.0,
                margin=weeks - 6.0,
                evidence=f"Conservative treatment duration insufficient ({duration_str or 'unknown'}). Guidelines recommend minimum 6-12 weeks of conservative management before surgical consideration.",
                confidence=0.8,
            )
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED,
            evidence=f"Duration {duration_str or 'documented'}; red flags present or duration >= 6 weeks.",
            confidence=0.8,
        )


class ImagingClinicalCorrelationConstraint(FormalConstraint):
    def __init__(self):
        super().__init__(
            constraint_id="CLIN_004",
            name="imaging_clinical_correlation",
            description="Both imaging and clinical findings required for correlation",
        )

    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        imaging = (design_data.get("imaging_summary") or "").strip()
        symptoms = (design_data.get("presenting_symptoms") or "").strip()
        if len(imaging) > 10 and len(symptoms) > 10:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_SATISFIED,
                evidence="Both imaging and clinical findings available for correlation",
                confidence=1.0,
            )
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_VIOLATED,
            evidence="Imaging-clinical correlation incomplete. Both imaging findings and clinical presentation required for surgical decision-making.",
            confidence=0.9,
        )


# --- Risk factor constraints ---


class DiabetesSurgicalRiskConstraint(FormalConstraint):
    def __init__(self):
        super().__init__(
            constraint_id="CLIN_005",
            name="diabetes_surgical_risk",
            description="Diabetes identified; glycaemic optimisation required",
        )

    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        comorbidities = _get_comorbidities_list(design_data)
        combined = " ".join(comorbidities).lower()
        if any(kw in combined for kw in ["diabetes", "hba1c", "glucose"]):
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_VIOLATED,
                evidence="Diabetes identified as comorbidity. Pre-operative glycaemic optimisation required. HbA1c target <69 mmol/mol (8.5%) recommended for elective spine surgery.",
                confidence=0.9,
            )
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED,
            evidence="No diabetes-related surgical risk identified",
            confidence=0.85,
        )


class ObesitySurgicalRiskConstraint(FormalConstraint):
    def __init__(self):
        super().__init__(
            constraint_id="CLIN_006",
            name="obesity_surgical_risk",
            description="Obesity elevates perioperative risk",
        )

    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        bmi = _parse_bmi(_get_comorbidities_list(design_data))
        if bmi is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_SATISFIED,
                evidence="No BMI documented; obesity risk not identified",
                confidence=0.5,
            )
        if bmi > 40:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_VIOLATED,
                value=bmi,
                threshold=40.0,
                margin=40.0 - bmi,
                evidence=f"Morbid obesity (BMI {bmi}). Significantly elevated surgical risk. Consider weight optimisation programme. Higher rates of wound complications, hardware failure, and prolonged operative time.",
                confidence=0.9,
            )
        if bmi > 30:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_VIOLATED,
                value=bmi,
                threshold=30.0,
                margin=30.0 - bmi,
                evidence=f"Obesity (BMI {bmi}). Elevated perioperative risk. Consider optimisation. Associated with increased wound infection and dural tear risk.",
                confidence=0.85,
            )
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED,
            value=bmi,
            evidence=f"BMI {bmi} — within acceptable range",
            confidence=0.9,
        )


class SmokingSurgicalRiskConstraint(FormalConstraint):
    def __init__(self):
        super().__init__(
            constraint_id="CLIN_007",
            name="smoking_surgical_risk",
            description="Smoking/tobacco impairs fusion and wound healing",
        )

    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        comorbidities = _get_comorbidities_list(design_data)
        combined = " ".join(comorbidities).lower()

        non_smoker_phrases = [
            "non-smoker", "non smoker", "nonsmoker",
            "never smoked", "never-smoked",
            "ex-smoker", "ex smoker", "exsmoker",
            "former smoker", "previously smoked",
            "stopped smoking", "quit smoking", "ceased smoking",
            "not a smoker", "does not smoke", "doesn't smoke",
            "no smoking", "no tobacco",
        ]
        for phrase in non_smoker_phrases:
            if phrase in combined:
                return ConstraintCheckResult(
                    constraint_id=self.constraint_id,
                    constraint_name=self.name,
                    result=CheckResult.PROVEN_SATISFIED,
                    evidence=f"Non-smoker or ex-smoker identified: '{phrase}' found in comorbidities",
                    confidence=0.9,
                )

        smoking_keywords = ["smok", "tobacco", "nicotine"]
        matched = _keyword_present_not_negated(combined, smoking_keywords)
        if matched:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_VIOLATED,
                evidence="Smoking/tobacco use identified. Strong evidence for impaired fusion rates and wound healing. Minimum 4-week cessation pre-operatively recommended for elective procedures.",
                confidence=0.9,
            )
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED,
            evidence="No smoking/tobacco use identified",
            confidence=0.8,
        )


class AnticoagulantRiskConstraint(FormalConstraint):
    def __init__(self):
        super().__init__(
            constraint_id="CLIN_008",
            name="anticoagulant_risk",
            description="Anticoagulant/antiplatelet therapy requires bridging protocol",
        )
        self.keywords = [
            "warfarin",
            "anticoagulant",
            "blood thinner",
            "aspirin",
            "clopidogrel",
            "apixaban",
            "rivaroxaban",
            "doac",
        ]

    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        comorbidities = _get_comorbidities_list(design_data)
        prior = _get_prior_treatments_list(design_data)
        combined = " ".join(comorbidities + prior).lower()
        matched = [k for k in self.keywords if k in combined]
        if matched:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_VIOLATED,
                evidence=f"Anticoagulant/antiplatelet therapy identified: {', '.join(matched)}. Perioperative bridging protocol required. Haematology review recommended.",
                confidence=0.9,
            )
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED,
            evidence="No anticoagulant/antiplatelet therapy identified",
            confidence=0.8,
        )


# --- Decision quality constraints ---


class PatientGoalsDocumentedConstraint(FormalConstraint):
    def __init__(self):
        super().__init__(
            constraint_id="CLIN_009",
            name="patient_goals_documented",
            description="Patient goals required for shared decision-making",
        )

    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        goals = (design_data.get("patient_goals") or "").strip()
        if len(goals) > 10:
            preview = goals[:80] + ("..." if len(goals) > 80 else "")
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_SATISFIED,
                evidence=f"Patient goals documented: {preview}",
                confidence=1.0,
            )
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_VIOLATED,
            evidence="Patient goals not documented. Shared decision-making requires explicit patient goal elicitation.",
            confidence=0.9,
        )


class OccupationImpactAssessedConstraint(FormalConstraint):
    def __init__(self):
        super().__init__(
            constraint_id="CLIN_010",
            name="occupation_impact_assessed",
            description="Occupational demands required for return-to-work planning",
        )

    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        occ = (design_data.get("occupation_demands") or "").strip()
        if len(occ) > 0:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_SATISFIED,
                evidence="Occupational demands documented",
                confidence=1.0,
            )
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_VIOLATED,
            evidence="Occupational demands not assessed. Return-to-work planning requires occupational assessment.",
            confidence=0.9,
        )


class AgeRiskStratificationConstraint(FormalConstraint):
    def __init__(self):
        super().__init__(
            constraint_id="CLIN_011",
            name="age_risk_stratification",
            description="Age-related risk stratification",
        )

    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        raw = design_data.get("age")
        try:
            age = int(raw) if raw is not None else None
        except (TypeError, ValueError):
            age = None
        if age is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Age not provided",
                confidence=0.0,
            )
        if age > 75:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_VIOLATED,
                value=float(age),
                evidence=f"Patient age {age}. Elderly patient — elevated anaesthetic risk, consider frailty screening, bone density assessment for instrumented procedures.",
                confidence=0.85,
            )
        if age > 65:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_VIOLATED,
                value=float(age),
                evidence=f"Patient age {age}. Consider age-related comorbidity screening and bone density assessment if fusion considered.",
                confidence=0.8,
            )
        if age < 18:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_VIOLATED,
                value=float(age),
                evidence=f"Paediatric patient (age {age}). Specialist paediatric spine assessment required.",
                confidence=0.95,
            )
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED,
            value=float(age),
            evidence=f"Age {age} — standard risk stratification",
            confidence=0.9,
        )


class SymptomDurationSurgicalTimingConstraint(FormalConstraint):
    def __init__(self):
        super().__init__(
            constraint_id="CLIN_012",
            name="symptom_duration_surgical_timing",
            description="Symptom duration and surgical timing considerations",
        )

    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        duration_str = design_data.get("symptom_duration") or ""
        weeks = _parse_duration_weeks(duration_str)
        symptoms = (design_data.get("presenting_symptoms") or "").lower()
        red_flags = _has_red_flag_indicators(symptoms)

        if weeks is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Symptom duration not parseable",
                confidence=0.0,
            )
        months = weeks / (52 / 12) if weeks else 0
        if months > 24:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_VIOLATED,
                value=weeks,
                evidence=f"Prolonged symptom duration ({duration_str}). Evidence suggests diminishing returns from surgical intervention beyond 12-24 months for radiculopathy. Discuss realistic outcome expectations.",
                confidence=0.8,
            )
        if weeks < 6 and not red_flags:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_VIOLATED,
                value=weeks,
                evidence=f"Very early presentation. Consider watchful waiting — many disc herniations resolve spontaneously.",
                confidence=0.75,
            )
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED,
            value=weeks,
            evidence="Symptom duration within typical surgical consideration window",
            confidence=0.85,
        )


# --- Checker and factory ---


def get_clinical_constraints() -> List[FormalConstraint]:
    """Return list of clinical constraint instances."""
    return [
        ProgressiveNeurologicalDeficitConstraint(),
        CaudaEquinaScreenConstraint(),
        ConservativeTreatmentDurationConstraint(),
        ImagingClinicalCorrelationConstraint(),
        DiabetesSurgicalRiskConstraint(),
        ObesitySurgicalRiskConstraint(),
        SmokingSurgicalRiskConstraint(),
        AnticoagulantRiskConstraint(),
        PatientGoalsDocumentedConstraint(),
        OccupationImpactAssessedConstraint(),
        AgeRiskStratificationConstraint(),
        SymptomDurationSurgicalTimingConstraint(),
    ]


class ClinicalConstraintChecker:
    """Checks design_data against spine surgery clinical constraints."""

    def __init__(self):
        self.constraints: List[FormalConstraint] = get_clinical_constraints()

    def check_all(self, design_data: Dict[str, Any]) -> List[ConstraintCheckResult]:
        return [c.check(design_data) for c in self.constraints]


# --- Clinical failure modes (risks to consider, not recommendations) ---


def detect_clinical_failure_modes(design_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Identify potential failure modes specific to the clinical scenario.
    These are risks that the surgeon should consider, NOT recommendations.
    """
    modes: List[Dict[str, Any]] = []
    symptoms = (design_data.get("presenting_symptoms") or "").lower()
    imaging = (design_data.get("imaging_summary") or "").lower()
    comorbidities = _get_comorbidities_list(design_data)
    comorbidities_lower = [c.lower() for c in comorbidities]
    leaning = (design_data.get("clinician_leaning") or "").lower()

    if "disc" in imaging or "herniation" in imaging:
        modes.append({
            "mode": "Disc re-herniation",
            "severity_score": 6,
            "severity_label": "moderate",
            "description": "5-15% recurrence rate post-discectomy. Higher risk with large annular defects.",
            "epistemic_confidence": 0.7,
            "rpn": 42,
        })

    if any(kw in leaning for kw in ["fusion", "arthrodesis", "plif", "tlif", "alif"]):
        confidence = 0.6
        if any("diabet" in c for c in comorbidities_lower):
            confidence = 0.75
        if any("smok" in c for c in comorbidities_lower):
            confidence = 0.8
        modes.append({
            "mode": "Pseudarthrosis / non-union",
            "severity_score": 7,
            "severity_label": "high",
            "description": "Failed fusion risk. Elevated with diabetes, smoking, multi-level procedures.",
            "epistemic_confidence": confidence,
            "rpn": 56,
        })

    modes.append({
        "mode": "Incidental durotomy",
        "severity_score": 4,
        "severity_label": "moderate",
        "description": "1-17% incidence depending on procedure and revision status. Generally manageable intraoperatively.",
        "epistemic_confidence": 0.65,
        "rpn": 24,
    })

    if any(kw in leaning for kw in ["fusion", "arthrodesis"]):
        modes.append({
            "mode": "Adjacent segment disease",
            "severity_score": 6,
            "severity_label": "moderate",
            "description": "2-4% annual incidence of symptomatic adjacent segment degeneration post-fusion.",
            "epistemic_confidence": 0.6,
            "rpn": 36,
        })

    infection_risk = 3
    if any("diabet" in c for c in comorbidities_lower):
        infection_risk += 2
    bmi_val = _parse_bmi(comorbidities)
    if bmi_val is not None:
        if bmi_val > 35:
            infection_risk += 2
        elif bmi_val > 30:
            infection_risk += 1
    desc_parts = ["Baseline 1-4% for spine surgery. Risk elevated by:"]
    if any("diabet" in c for c in comorbidities_lower):
        desc_parts.append("diabetes,")
    if any("bmi" in c.lower() for c in comorbidities):
        desc_parts.append("obesity,")
    if any("smok" in c for c in comorbidities_lower):
        desc_parts.append("smoking")
    else:
        desc_parts.append("standard risk factors")
    modes.append({
        "mode": "Surgical site infection",
        "severity_score": min(10, infection_risk),
        "severity_label": "moderate" if infection_risk <= 5 else "high",
        "description": " ".join(desc_parts).rstrip(",") + ".",
        "epistemic_confidence": 0.7,
        "rpn": infection_risk * 6,
    })

    if any(kw in symptoms for kw in ["weakness", "motor", "foot drop", "dorsiflexion"]):
        modes.append({
            "mode": "Irreversible neurological deficit if delayed",
            "severity_score": 9,
            "severity_label": "critical",
            "description": "Progressive motor weakness present. Delayed intervention risks permanent deficit. Evidence supports earlier surgery for motor deficits.",
            "epistemic_confidence": 0.75,
            "rpn": 81,
        })

    return modes


def generate_clinical_falsifications(design_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Generate tests that could challenge the current clinical assumptions.
    These help the surgeon question their reasoning.
    """
    tests: List[Dict[str, Any]] = []
    symptoms = (design_data.get("presenting_symptoms") or "").lower()
    imaging = (design_data.get("imaging_summary") or "").lower()
    leaning = (design_data.get("clinician_leaning") or "").lower()
    prior_str = " ".join(_get_prior_treatments_list(design_data)).lower()
    comorbidities = _get_comorbidities_list(design_data)

    if any(kw in leaning for kw in ["surgery", "discectomy", "fusion", "decompression"]):
        tests.append({
            "test": "Would a repeat MRI in 6 weeks show spontaneous resorption?",
            "cost": "medium",
            "would_disprove": "Assumption that surgical intervention is necessary — large herniations have highest spontaneous resorption rates",
            "evidence_basis": "Up to 66% of disc herniations show spontaneous regression on repeat imaging",
        })

    if imaging:
        tests.append({
            "test": "Do the imaging findings explain ALL of the patient's symptoms?",
            "cost": "low",
            "would_disprove": "Assumption of single pathology — could there be peripheral neuropathy, hip pathology, or vascular claudication contributing?",
            "evidence_basis": "Incidental disc findings present in 30-40% of asymptomatic individuals",
        })

    if "physiotherapy" in prior_str or "physical therapy" in prior_str:
        tests.append({
            "test": "Was the physiotherapy programme specific, supervised, and of adequate duration/intensity?",
            "cost": "low",
            "would_disprove": "Assumption that conservative management has truly failed — inadequate conservative treatment is common",
            "evidence_basis": "Supervised, structured physiotherapy programmes show superior outcomes to generic exercise advice",
        })

    if any("diabet" in str(c).lower() for c in comorbidities):
        tests.append({
            "test": "Is HbA1c currently <69 mmol/mol? When was it last measured?",
            "cost": "low",
            "would_disprove": "Assumption that patient is optimised for surgery — uncontrolled diabetes significantly increases complication rates",
            "evidence_basis": "HbA1c >69 associated with 2-3x wound infection risk in spine surgery",
        })

    tests.append({
        "test": "Has the patient been informed of the NNT (number needed to treat) for their specific procedure/indication?",
        "cost": "low",
        "would_disprove": "Assumption that the patient has realistic outcome expectations — surgical consent requires understanding of probable benefit magnitude",
        "evidence_basis": "Patient satisfaction correlates more with expectation management than surgical outcome",
    })

    if "progressive" in symptoms or "weakness" in symptoms:
        tests.append({
            "test": "Is the motor deficit objectively worsening on serial examination, or stable?",
            "cost": "low",
            "would_disprove": "Assumption that deficit is progressive — a stable mild deficit has different surgical urgency than a deteriorating one",
            "evidence_basis": "Serial neurological examination more reliable than single-timepoint assessment",
        })

    # If patient is elderly (age > 70)
    try:
        age_val = int(design_data.get("age", 0) or 0)
        if age_val > 70:
            tests.append({
                "test": "Has a formal frailty assessment been completed (e.g., Clinical Frailty Scale)?",
                "cost": "low",
                "would_disprove": "Assumption that age alone determines surgical risk — frailty is a better predictor than chronological age",
                "evidence_basis": "Clinical Frailty Scale predicts post-operative complications better than age alone in spine surgery",
            })
    except (TypeError, ValueError):
        pass

    # If previous surgery mentioned
    prior_str = " ".join(_get_prior_treatments_list(design_data)).lower()
    if any(kw in prior_str for kw in ["surgery", "decompression", "fusion", "discectomy", "operation"]):
        tests.append({
            "test": "What changed since the previous surgery? Is this recurrence, progression, or a new problem?",
            "cost": "low",
            "would_disprove": "Assumption that repeat surgery will succeed — revision spine surgery has lower success rates than primary procedures",
            "evidence_basis": "Revision lumbar surgery success rates 50-70% vs 80-90% for primary procedures",
        })

    # If chronic pain indicators (duration > 12 months + psychosocial flags)
    comorbidities_str = " ".join(_get_comorbidities_list(design_data)).lower()
    if any(kw in comorbidities_str for kw in ["anxiety", "depression", "fibromyalgia", "chronic pain"]):
        tests.append({
            "test": "Has central sensitisation been formally assessed? Could this be a chronic pain syndrome rather than a structural problem?",
            "cost": "low",
            "would_disprove": "Assumption that structural pathology is the primary pain driver — central sensitisation can persist independently of peripheral pathology",
            "evidence_basis": "Up to 25% of chronic back pain patients have central sensitisation as a primary driver, where surgery has poor outcomes",
        })

    # If patient requesting specific surgery
    goals = (design_data.get("patient_goals") or "").lower()
    if any(kw in goals for kw in ["wants surgery", "requesting surgery", "asking about", "just take"]):
        tests.append({
            "test": "Is the patient's treatment preference based on accurate understanding of outcomes, or on expectations from family/online research?",
            "cost": "low",
            "would_disprove": "Assumption that patient preference equals informed preference — decision quality depends on understanding realistic outcomes",
            "evidence_basis": "Patient decision aids reduce surgery preference by 20% when realistic outcome information is provided",
        })

    # If occupation involves heavy manual work
    occ = (design_data.get("occupation_demands") or "").lower()
    if any(kw in occ for kw in ["manual", "lifting", "heavy", "physical", "standing 10", "standing 8"]):
        tests.append({
            "test": "Has occupational health been consulted about workplace modifications regardless of treatment choice?",
            "cost": "low",
            "would_disprove": "Assumption that surgery alone will enable return to heavy work — workplace modification often needed alongside any treatment",
            "evidence_basis": "Return to heavy manual work rates are 60-70% post-spine surgery — workplace assessment improves outcomes",
        })

    return tests
