from fastapi import APIRouter, Query
from typing import Optional
from app.services.clinicaltrials_service import fetch_trials

router = APIRouter()


@router.get("/search")
async def search_trials(
    condition: str          = Query(..., description="e.g. diabetes, cancer, hypertension"),
    location:  Optional[str] = Query(None, description="e.g. Mumbai, India, New York"),
    page_size: int          = Query(10, le=50),
    page:      int          = Query(1, ge=1, description="Page number for pagination")
):
    """
    Search real recruiting trials from ClinicalTrials.gov
    by condition and optional location.
    """
    trials = await fetch_trials(condition, location, page_size)
    
    # Simple pagination on results
    start = (page - 1) * page_size
    end   = start + page_size
    paginated = trials[start:end]
    
    return {
        "count":       len(trials),
        "page":        page,
        "page_size":   page_size,
        "trials":      paginated
    }