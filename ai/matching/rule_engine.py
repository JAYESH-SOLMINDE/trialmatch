from ai.nlp.eligibility_parser import parse_eligibility

CONDITION_KEYWORDS = {
    "diabetes":       ["diabetes", "diabetic", "hba1c", "insulin", "glucose", "t2dm", "t1dm"],
    "hypertension":   ["hypertension", "high blood pressure", "htn"],
    "cancer":         ["cancer", "tumor", "oncology", "carcinoma", "lymphoma", "leukemia"],
    "heart disease":  ["heart disease", "cardiac", "coronary", "heart failure", "cvd"],
    "asthma":         ["asthma", "bronchial", "inhaler"],
    "kidney disease": ["kidney disease", "renal", "nephropathy", "ckd"],
    "hiv":            ["hiv", "aids", "antiretroviral"],
    "alzheimer":      ["alzheimer", "dementia", "cognitive decline"],
}

# These phrases in exclusion criteria should NOT flag a patient
# who has a related but different condition
EXCLUSION_SAFE_PHRASES = [
    # Type 1 vs Type 2 — don't flag T2D patient for T1D exclusion
    ("type 1 diabetes",   ["type 2 diabetes", "t2dm", "type 2"]),
    ("type 2 diabetes",   ["type 1 diabetes", "t1dm", "type 1"]),
    ("t1dm",              ["type 2 diabetes", "t2dm"]),
    ("t1d",               ["type 2 diabetes", "t2dm"]),
    # Gestational diabetes exclusion shouldn't flag T2D
    ("gestational diabetes", ["type 2 diabetes", "t2dm"]),
    # Diabetic ketoacidosis is a complication, not a condition
    ("diabetic ketoacidosis", ["type 2 diabetes", "t2dm"]),
    ("dka",                   ["type 2 diabetes", "t2dm"]),
    # Renal failure vs kidney disease
    ("renal failure",     ["kidney disease", "ckd"]),
    ("hepatic failure",   ["liver disease"]),
    # Cancer history vs active cancer
    ("history of malignancy", ["cancer"]),
    ("history of cancer",     ["cancer"]),
     # "Diabetes induced by X" should not flag T2D patient
    ("diabetes mellitus and/or obesity that is induced", ["type 2 diabetes", "t2dm"]),
    # "History of type I" should not flag T2D patient  
    ("history of type i diabetes", ["type 2 diabetes", "t2dm"]),
]

# Exclusion phrases that are complications/warnings, not conditions
# These should produce warnings, not hard failures
SOFT_EXCLUSION_PHRASES = [
    "history of",
    "prior",
    "previous",
    "within 90 days",
    "within 6 months",
    "within 3 months",
    "within 30 days",
    "within 180 days",
]


def match_patient_to_trial(patient: dict, trial: dict) -> dict:
    parsed   = parse_eligibility(trial.get("eligibility", ""))
    passed   = []
    failed   = []
    warnings = []

    # ── 1. Age check ──
    age     = patient.get("age", 0)
    age_min = parsed["age"]["min"]
    age_max = parsed["age"]["max"]

    if age_min <= age <= age_max:
        passed.append(f"✔ Age {age} is within range ({age_min}–{age_max})")
    else:
        failed.append(f"✖ Age {age} outside required range ({age_min}–{age_max})")

    # ── 2. Sex check ──
    trial_sex   = parsed["sex"]
    patient_sex = patient.get("sex", "ALL").upper()

    if trial_sex == "ALL" or trial_sex == patient_sex:
        passed.append(f"✔ Sex requirement met ({trial_sex})")
    else:
        failed.append(f"✖ Sex mismatch — trial requires {trial_sex}")

    # ── 3. Condition matching ──
    patient_conditions = [c.lower() for c in patient.get("conditions", [])]
    trial_conditions   = [c.lower() for c in trial.get("conditions", [])]

    matched_conditions = []
    for trial_cond in trial_conditions:
        for patient_cond in patient_conditions:
            if _conditions_match(patient_cond, trial_cond):
                matched_conditions.append(trial_cond)
                break

    if matched_conditions:
        passed.append(f"✔ Condition match: {', '.join(matched_conditions)}")
    else:
        warnings.append("⚠ No direct condition match — manual review suggested")

    # ── 4. Smart exclusion criteria check ──
    patient_meds       = [m.lower() for m in patient.get("medications", [])]
    patient_conditions_lower = [c.lower() for c in patient.get("conditions", [])]

    for exc in parsed["exclusion"]:
        exc_lower = exc.lower()

        # Skip if this exclusion is a time-based or history-based soft rule
        if _is_soft_exclusion(exc_lower):
            continue

        # Check conditions against exclusion
        for cond in patient_conditions_lower:
            if _should_exclude(cond, exc_lower):
                failed.append(
                    f"✖ Excluded: '{cond}' matches exclusion — {exc[:80]}..."
                    if len(exc) > 80 else f"✖ Excluded: '{cond}' matches exclusion — {exc}"
                )
                break

        # Check medications against exclusion
        for med in patient_meds:
            if med in exc_lower and len(med) > 3:
                # Only flag if medication is specifically mentioned in exclusion
                failed.append(f"✖ Excluded: medication '{med}' is in exclusion criteria")
                break

    # ── 5. Deduplicate failed reasons ──
    failed = list(dict.fromkeys(failed))

    # ── 6. Calculate score ──
    total_checks = len(passed) + len(failed)
    score = len(passed) / total_checks if total_checks > 0 else 0.0

    return {
        "eligible": len(failed) == 0,
        "score":    round(score, 2),
        "passed":   passed,
        "failed":   failed,
        "warnings": warnings
    }


def _should_exclude(patient_cond: str, exc_lower: str) -> bool:
    """
    Smart exclusion check — avoids false positives like
    flagging 'type 2 diabetes' when exclusion says 'type 1 diabetes'.
    """
    # First check if the exclusion even mentions this condition broadly
    if not _broad_condition_match(patient_cond, exc_lower):
        return False

    # Now check if it's actually a SAFE mismatch (different variant)
    for exc_phrase, safe_patient_phrases in EXCLUSION_SAFE_PHRASES:
        if exc_phrase in exc_lower:
            for safe_phrase in safe_patient_phrases:
                if safe_phrase in patient_cond:
                    # Patient has a safe variant — not excluded
                    return False

    return True


def _broad_condition_match(patient_cond: str, exc_lower: str) -> bool:
    """Check if exclusion text broadly mentions the patient's condition."""
    for canonical, keywords in CONDITION_KEYWORDS.items():
        patient_match = (
            any(kw in patient_cond for kw in keywords)
            or canonical in patient_cond
        )
        exc_match = (
            any(kw in exc_lower for kw in keywords)
            or canonical in exc_lower
        )
        if patient_match and exc_match:
            return True
    return patient_cond in exc_lower


def _is_soft_exclusion(exc_lower: str) -> bool:
    """
    Returns True if exclusion should be skipped — either time-based,
    history-based, or a complication/induced variant not matching
    the patient's primary condition.
    """
    # Time-based rules
    time_based = any(phrase in exc_lower for phrase in SOFT_EXCLUSION_PHRASES)
    if time_based:
        return True

    # "Induced by" / "secondary to" — not the patient's primary condition
    if any(phrase in exc_lower for phrase in [
        "induced by", "secondary to", "caused by",
        "due to pancreatitis", "due to pancrea",
        "beta-cell transplantation",
        "diabetes secondary",
        "obesity that is induced",
    ]):
        return True

    # Complication-based exclusions — these are about complications,
    # not the diagnosis itself
    if any(phrase in exc_lower for phrase in [
        "diabetic retinopathy",
        "diabetic maculopathy",
        "diabetic ketoacidosis",
        "diabetic gastroparesis",
        "uncontrolled t2dm",
        "poorly controlled",
        "brittle or labile",
        "complications of t2dm",
        "complications of diabetes",
    ]):
        return True

    return False


def _conditions_match(patient_cond: str, trial_cond: str) -> bool:
    """Check if patient condition matches trial condition."""
    for canonical, keywords in CONDITION_KEYWORDS.items():
        patient_match = (
            any(kw in patient_cond for kw in keywords)
            or canonical in patient_cond
        )
        trial_match = (
            any(kw in trial_cond for kw in keywords)
            or canonical in trial_cond
        )
        if patient_match and trial_match:
            return True
    return patient_cond in trial_cond or trial_cond in patient_cond