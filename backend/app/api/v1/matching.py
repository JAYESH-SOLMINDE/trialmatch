import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "../../../../"))

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.clinicaltrials_service import fetch_trials
from ai.matching.ml_matcher import rank_trials

router = APIRouter()


class PatientInput(BaseModel):
    age:         int
    sex:         str = "ALL"
    conditions:  list[str]
    medications: list[str] = []
    lab_values:  dict = {}
    location:    Optional[str] = None


class MatchResponse(BaseModel):
    total_trials_fetched: int
    eligible_count:       int
    results:              list[dict]


@router.post("/match", response_model=MatchResponse)
async def match_patient(patient: PatientInput):
    """
    Match a patient to real clinical trials from ClinicalTrials.gov.
    Returns ranked list with eligibility explanations and confidence scores.
    """
    if not patient.conditions:
        raise HTTPException(
            status_code=400,
            detail="At least one condition is required"
        )

    # Fetch real trials for each condition
    all_trials = []
    for condition in patient.conditions:
        trials = await fetch_trials(
            condition=condition,
            location=patient.location,
            page_size=15
        )
        all_trials.extend(trials)

    # Remove duplicates by NCT ID
    seen          = set()
    unique_trials = []
    for t in all_trials:
        if t["nct_id"] not in seen:
            seen.add(t["nct_id"])
            unique_trials.append(t)

    if not unique_trials:
        return {
            "total_trials_fetched": 0,
            "eligible_count":       0,
            "results":              []
        }

    # Run AI matching
    ranked = rank_trials(patient.model_dump(), unique_trials)

    return {
        "total_trials_fetched": len(unique_trials),
        "eligible_count":       sum(1 for r in ranked if r["eligible"]),
        "results":              ranked[:20]
    }