"""The ethics rubric, rebuilt in Python from src/lib/rubric.ts. Shared by the analysis steps."""

NOW = 2026

# The app's settings (src/lib/rubric.ts). We copy them so we can change them one at a time.
BASE = dict(
    exclude=8, borderline=4, half_life=12, floor=0.25, allegation=0.3, neutral_weight=3,
    other_incidents=0.5, floor_severity=4, floor_min_weight=3,
)


def incident_score(i, p):
    decay = max(p["floor"], 0.5 ** (max(0, NOW - i["year"]) / p["half_life"]))
    confirmed = 1 if i["confirmed"] else p["allegation"]
    return i["severity"] * i["relativeScale"] * confirmed * (1 - i["remediation"]) * decay


def cause_score(incidents, weight, p):
    # The worst incident counts in full, the others at a reduced share, scaled by how much the client cares.
    scores = sorted((incident_score(i, p) for i in incidents), reverse=True)
    return (scores[0] + p["other_incidents"] * sum(scores[1:])) * (weight / p["neutral_weight"])


def company_score(record, causes, p):
    """The highest cause score for the company, after the severity floor. 0 if no incidents on the client's causes."""
    worst = 0.0
    for c in causes:
        incidents = record["causes"].get(c["causeId"], {}).get("incidents", [])
        if not incidents:
            continue
        score = cause_score(incidents, c["weight"], p)
        severe = [i for i in incidents if i["confirmed"] and i["severity"] >= p["floor_severity"]]
        if c["weight"] >= p["floor_min_weight"] and severe and score < p["borderline"]:
            score = p["borderline"]  # a serious confirmed incident is never forgotten
        worst = max(worst, score)
    return worst


def status(score, p):
    return "excluded" if score >= p["exclude"] else "close call" if score >= p["borderline"] else "pass"
