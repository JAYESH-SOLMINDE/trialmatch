import numpy as np
from ai.matching.rule_engine import match_patient_to_trial


def rank_trials(patient: dict, trials: list[dict]) -> list[dict]:
    """
    Score and rank all trials for a patient.
    Returns sorted list — best matches first.
    """
    results = []

    for trial in trials:
        match = match_patient_to_trial(patient, trial)

        # Build feature vector for ML scoring
        features = _build_features(patient, trial, match)
        ml_score = _compute_ml_score(features)

        # Combine rule score + ml score
        final_score = round((match["score"] * 0.6) + (ml_score * 0.4), 3)

        results.append({
            "trial":       trial,
            "eligible":    match["eligible"],
            "rule_score":  match["score"],
            "ml_score":    ml_score,
            "final_score": final_score,
            "confidence":  _score_to_confidence(final_score),
            "passed":      match["passed"],
            "failed":      match["failed"],
            "warnings":    match["warnings"]
        })

    # Sort by final score descending
    results.sort(key=lambda x: x["final_score"], reverse=True)
    return results


def _build_features(patient: dict, trial: dict, match: dict) -> np.ndarray:
    """Convert patient-trial pair into a numeric feature vector."""
    age_in_range    = 1.0 if not any("Age" in f for f in match["failed"]) else 0.0
    sex_ok          = 1.0 if not any("Sex" in f for f in match["failed"]) else 0.0
    condition_match = 1.0 if any("Condition" in p for p in match["passed"]) else 0.0
    no_exclusions   = 1.0 if not any("Excluded" in f for f in match["failed"]) else 0.0
    has_phase       = 1.0 if trial.get("phase") else 0.0
    is_recruiting   = 1.0 if trial.get("status") == "RECRUITING" else 0.0
    passed_ratio    = match["score"]

    return np.array([
        age_in_range,
        sex_ok,
        condition_match,
        no_exclusions,
        has_phase,
        is_recruiting,
        passed_ratio
    ])


def _compute_ml_score(features: np.ndarray) -> float:
    """
    Weighted scoring — mimics a trained model.
    In Phase 3 we replace this with a real trained XGBoost model.
    """
    weights = np.array([0.20, 0.15, 0.25, 0.20, 0.05, 0.10, 0.05])
    score   = float(np.dot(features, weights))
    return round(min(max(score, 0.0), 1.0), 3)


def _score_to_confidence(score: float) -> str:
    if score >= 0.80:
        return "HIGH"
    elif score >= 0.55:
        return "MEDIUM"
    else:
        return "LOW"