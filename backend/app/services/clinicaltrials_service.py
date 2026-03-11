import requests
import asyncio
from typing import Optional
from functools import partial

CTGOV_URL = "https://clinicaltrials.gov/api/v2/studies"

HEADERS = {
    "User-Agent":      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept":          "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
}


def _fetch_trials_sync(
    condition: str,
    location: Optional[str] = None,
    page_size: int = 20
) -> list[dict]:

    params = {
        "query.cond":           condition,
        "filter.overallStatus": "RECRUITING",
        "pageSize":             page_size,
        "format":               "json"
    }

    if location:
        params["query.locn"] = location

    # Retry up to 3 times if request fails
    last_error = None
    for attempt in range(3):
        try:
            response = requests.get(
                CTGOV_URL,
                params=params,
                headers=HEADERS,
                timeout=20
            )
            response.raise_for_status()
            data = response.json()

            trials = []
            for study in data.get("studies", []):
                proto = study.get("protocolSection", {})
                trials.append({
                    "nct_id":      _safe_get(proto, "identificationModule", "nctId"),
                    "title":       _safe_get(proto, "identificationModule", "briefTitle"),
                    "conditions":  proto.get("conditionsModule", {}).get("conditions", []),
                    "eligibility": proto.get("eligibilityModule", {}).get("eligibilityCriteria", ""),
                    "min_age":     proto.get("eligibilityModule", {}).get("minimumAge", "N/A"),
                    "max_age":     proto.get("eligibilityModule", {}).get("maximumAge", "N/A"),
                    "sex":         proto.get("eligibilityModule", {}).get("sex", "ALL"),
                    "phase":       proto.get("designModule", {}).get("phases", []),
                    "status":      _safe_get(proto, "statusModule", "overallStatus"),
                    "summary":     _safe_get(proto, "descriptionModule", "briefSummary"),
                    "sponsor":     proto.get("sponsorCollaboratorsModule", {}).get("leadSponsor", {}).get("name", ""),
                    "locations":   _extract_locations(proto)
                })

            return trials

        except requests.exceptions.Timeout:
            last_error = "ClinicalTrials.gov timed out"
        except requests.exceptions.ConnectionError:
            last_error = "Could not connect to ClinicalTrials.gov"
        except Exception as e:
            last_error = str(e)

        # Wait before retrying (1s, 2s, 3s)
        import time
        time.sleep(attempt + 1)

    # All retries failed — return empty list with log
    print(f"[ClinicalTrials] All retries failed: {last_error}")
    return []


async def fetch_trials(
    condition: str,
    location: Optional[str] = None,
    page_size: int = 20
) -> list[dict]:
    # Run sync requests call in thread pool so FastAPI stays async
    loop = asyncio.get_event_loop()
    fn   = partial(_fetch_trials_sync, condition, location, page_size)
    return await loop.run_in_executor(None, fn)


def _safe_get(proto: dict, module: str, field: str) -> str:
    return proto.get(module, {}).get(field, "")


def _extract_locations(proto: dict) -> list[str]:
    locations = []
    contacts = proto.get("contactsLocationsModule", {})
    for loc in contacts.get("locations", []):
        city    = loc.get("city", "")
        country = loc.get("country", "")
        if city or country:
            locations.append(f"{city}, {country}".strip(", "))
    return locations