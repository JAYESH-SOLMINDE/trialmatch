import re
import spacy

nlp = spacy.load("en_core_web_sm")

def parse_eligibility(text: str) -> dict:
    """
    Parse raw eligibility criteria text into structured inclusion
    and exclusion rules.

    Example input:
        'Inclusion Criteria:
         - Age 18-65
         - Type 2 Diabetes diagnosis
         Exclusion Criteria:
         - Kidney disease'

    Returns:
        {
          "inclusion": [...],
          "exclusion": [...],
          "age":       {"min": 18, "max": 65},
          "sex":       "ALL"
        }
    """
    result = {
        "inclusion": [],
        "exclusion": [],
        "age": {"min": 0, "max": 120},
        "sex": "ALL"
    }

    if not text:
        return result

    # ── Split into inclusion / exclusion blocks ──
    text_lower = text.lower()
    exc_index  = text_lower.find("exclusion criteria")
    inc_index  = text_lower.find("inclusion criteria")

    if inc_index != -1 and exc_index != -1:
        inclusion_text = text[inc_index:exc_index]
        exclusion_text = text[exc_index:]
    elif inc_index != -1:
        inclusion_text = text[inc_index:]
        exclusion_text = ""
    else:
        inclusion_text = text
        exclusion_text = ""

    result["inclusion"] = _extract_criteria_lines(inclusion_text)
    result["exclusion"] = _extract_criteria_lines(exclusion_text)

    # ── Extract age range ──
    age_range = _extract_age(text)
    if age_range:
        result["age"] = age_range

    # ── Extract sex ──
    result["sex"] = _extract_sex(text)

    return result


def _extract_criteria_lines(text: str) -> list[str]:
    """Pull individual criteria bullet points from a text block."""
    lines = []
    for line in text.split("\n"):
        line = line.strip()
        # Remove bullet markers
        line = re.sub(r'^[-•*\d+\.]\s*', '', line)
        # Skip headers and empty lines
        if len(line) > 10 and "criteria" not in line.lower():
            lines.append(line)
    return lines


def _extract_age(text: str) -> dict | None:
    """Extract age constraints from text — range pattern takes priority."""
    min_age, max_age = 0, 120

    # Check range pattern FIRST — "18 to 65 years" or "18-65 years"
    # This takes priority over individual min/max patterns
    range_match = re.search(r'(\d+)\s*(?:to|-)\s*(\d+)\s*year', text, re.I)
    if range_match:
        return {
            "min": int(range_match.group(1)),
            "max": int(range_match.group(2))
        }

    # Then check individual min pattern: "18 years and older", "at least 18 years"
    min_match = re.search(
        r'(?:at least|minimum|≥|>=|older than|>\s*)\s*(\d+)\s*year', text, re.I
    )
    if min_match:
        min_age = int(min_match.group(1))

    # Then check individual max pattern: "up to 65 years", "maximum 65"
    max_match = re.search(
        r'(?:up to|maximum|≤|<=|no more than|younger than|<\s*)\s*(\d+)\s*year', text, re.I
    )
    if max_match:
        max_age = int(max_match.group(1))

    return {"min": min_age, "max": max_age}

def _extract_sex(text: str) -> str:
    text_lower = text.lower()
    if "male only" in text_lower or "men only" in text_lower:
        return "MALE"
    if "female only" in text_lower or "women only" in text_lower:
        return "FEMALE"
    return "ALL"