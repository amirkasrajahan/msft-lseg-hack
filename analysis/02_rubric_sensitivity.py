"""Step 2: how sensitive is the ethics rubric to its settings?

Run from the repo root:
    analysis/.venv/bin/python analysis/02_rubric_sensitivity.py

The app scores each company from its incidents and compares the score with two lines: a "close call" line
and an "exclusion" line. Those lines (and a few other settings) are judgement calls. The question here is:
if we nudge them, how many companies change outcome? If very few do, the rule is stable. If many do,
the result depends on a choice we should explain.

Skills practised: rebuilding a rule as a function, checking it against a reference, a parameter sweep,
comparing two results row by row, and a line chart.
"""
import json
from pathlib import Path

import matplotlib
import pandas as pd

matplotlib.use("Agg")
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(__file__).resolve().parent / "charts"
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


# 1. LOAD the evidence and the two demo clients. Only "full" coverage records can be rated.
records = [json.loads(f.read_text()) for f in sorted((ROOT / "data/ethics").glob("*.json"))]
rated = [r for r in records if r["coverage"] == "full"]
clients = {
    "Cautious climate saver": json.loads((ROOT / "data/personas/cautious-climate.json").read_text())["causes"],
    "Growth-seeking engineer": json.loads((ROOT / "data/personas/aggressive-no-weapons.json").read_text())["causes"],
}
# Two extra clients that care about every cause, so the rule has more to bite on. Weight 3 is the app's neutral
# weight, 5 means non-negotiable. Causes are read from the data itself.
all_causes = sorted({c for r in records for c in r["causes"]})
clients["Institution: all causes, weight 3"] = [{"causeId": c, "weight": 3} for c in all_causes]
clients["Strict institution: all causes, weight 5"] = [{"causeId": c, "weight": 5} for c in all_causes]
print(f"{len(records)} evidence records, {len(rated)} with full coverage (the rest cannot be rated)\n")


def outcomes(causes, **changes):
    """Status of every rated company under the given settings, as a Series indexed by ticker."""
    p = {**BASE, **changes}
    return pd.Series({r["ticker"]: status(company_score(r, causes, p), p) for r in rated})


# 2. BASELINE. What the app does today.
rows = []
for name, causes in clients.items():
    counts = outcomes(causes).value_counts()
    rows.append({"client": name, **{k: int(counts.get(k, 0)) for k in ["excluded", "close call", "pass"]}})
baseline = pd.DataFrame(rows)
print("Baseline outcomes (current settings):\n", baseline.to_string(index=False), "\n")

# 3. SWEEP one setting: move the exclusion line and keep the close-call line at half of it.
fig, ax = plt.subplots(figsize=(8, 5))
sweep = []
for name, causes in clients.items():
    xs = list(range(4, 17))
    ys = [(outcomes(causes, exclude=x, borderline=x / 2) == "excluded").sum() for x in xs]
    ax.plot(xs, ys, marker="o", label=name)
    sweep += [{"client": name, "exclusion_line": x, "excluded": int(y)} for x, y in zip(xs, ys)]
ax.axvline(BASE["exclude"], color="grey", linestyle="--")
ax.text(BASE["exclude"] + 0.15, ax.get_ylim()[1] * 0.92, "current line (8)", color="grey")
ax.set_xlabel("Exclusion line (score needed to exclude a company)")
ax.set_ylabel("Companies excluded (of those rated)")
ax.set_title("Moving the exclusion line: how many companies are excluded")
ax.legend()
fig.tight_layout()
fig.savefig(OUT / "exclusion_line_sweep.png", dpi=150)
sweep = pd.DataFrame(sweep)
sweep.to_csv(OUT / "exclusion_line_sweep.csv", index=False)

# 4. ONE-AT-A-TIME. Change a single setting, count companies whose outcome differs from the baseline.
tests = {
    "Half-life of incidents: 6 years (fades faster)": dict(half_life=6),
    "Half-life of incidents: 24 years (fades slower)": dict(half_life=24),
    "Allegations count 0.1 (instead of 0.3)": dict(allegation=0.1),
    "Allegations count 0.6 (instead of 0.3)": dict(allegation=0.6),
    "Other incidents count 0 (worst only)": dict(other_incidents=0.0),
    "Other incidents count 1 (all in full)": dict(other_incidents=1.0),
    "Severity floor off": dict(floor_severity=99),
    "Exclusion line 6 (stricter)": dict(exclude=6),
    "Exclusion line 10 (looser)": dict(exclude=10),
}
rows = []
for name, causes in clients.items():
    base = outcomes(causes)
    for label, change in tests.items():
        new = outcomes(causes, **change)
        moved = new != base
        rows.append({
            "client": name,
            "change": label,
            "excluded": int((new == "excluded").sum()),
            "excluded_vs_base": int((new == "excluded").sum() - (base == "excluded").sum()),
            "companies_changing_outcome": int(moved.sum()),
        })
table = pd.DataFrame(rows)
table.to_csv(OUT / "rubric_sensitivity.csv", index=False)
pd.set_option("display.width", 200, "display.max_colwidth", 60)
print("One setting at a time (companies whose outcome changes vs today):\n", table.to_string(index=False), "\n")

# 5. CHART of the same table: how many companies change outcome, per change.
fig, ax = plt.subplots(figsize=(9, 5))
piv = table.pivot(index="change", columns="client", values="companies_changing_outcome").loc[list(tests)]
piv.plot.barh(ax=ax)
ax.invert_yaxis()
ax.set_xlabel(f"Companies whose outcome changes (of {len(rated)} rated)")
ax.set_ylabel("")
ax.set_title("How much each setting matters")
fig.tight_layout()
fig.savefig(OUT / "rubric_sensitivity.png", dpi=150)
print("Charts saved in analysis/charts/")
