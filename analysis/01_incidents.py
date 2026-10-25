"""Step 1: load the ethics evidence into a table and ask simple questions of it.

Run from the repo root:
    analysis/.venv/bin/python analysis/01_incidents.py

The skill this practises: turning nested JSON into a flat table (one row per incident), then
grouping and counting. This is the most common first step in real data analyst work.
"""
import json
from pathlib import Path

import matplotlib
import pandas as pd

matplotlib.use("Agg")  # draw to files, no window needed
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(__file__).resolve().parent / "charts"

# 1. LOAD. The universe is one row per company; the evidence is nested (company > cause > incidents).
universe = pd.DataFrame(json.loads((ROOT / "data/universe.json").read_text()))

rows = []
for path in sorted((ROOT / "data/ethics").glob("*.json")):
    record = json.loads(path.read_text())
    for cause, block in record["causes"].items():
        for inc in block.get("incidents", []):
            rows.append(
                {
                    "ticker": record["ticker"],
                    "cause": cause,
                    "year": inc["year"],
                    "confirmed": inc["confirmed"],
                    "scale": inc["relativeScale"],
                    "remediation": inc["remediation"],
                    "n_sources": len(inc.get("sources", [])),
                }
            )
incidents = pd.DataFrame(rows)

# 2. JOIN. Attach each company's sector, the same idea as a SQL LEFT JOIN on ticker.
incidents = incidents.merge(universe[["ticker", "name", "sector"]], on="ticker", how="left")

# SHOW EACH TABLE. Look at these first, so you know what every later step is working on.
pd.set_option("display.width", 200, "display.max_columns", 20, "display.max_colwidth", 40)
print("=== universe: one row per company (from data/universe.json) ===")
print(f"{universe.shape[0]} rows, {universe.shape[1]} columns: {list(universe.columns)}")
print(universe[["ticker", "name", "sector", "tier", "index"]].head(5), "\n")

print("=== rows: a plain Python list of dictionaries, built in the loop. One dictionary per incident ===")
print(f"{len(rows)} items. The first one:")
print(rows[0], "\n")

print("=== incidents: that list turned into a table, then joined to the universe for name and sector ===")
print(f"{incidents.shape[0]} rows, {incidents.shape[1]} columns: {list(incidents.columns)}")
print(incidents.head(6), "\n")

researched = len(list((ROOT / "data/ethics").glob("*.json")))
print(f"{researched} companies researched, {incidents.ticker.nunique()} have at least one incident")
print(f"{len(incidents)} incidents in total, {incidents.confirmed.mean():.0%} confirmed\n")

# 3. GROUP AND COUNT. Which causes come up most?
by_cause = incidents.groupby("cause").size().sort_values(ascending=False)
print("Incidents by cause:\n", by_cause, "\n")

# 4. A rate, not just a count. Sectors differ in size, so compare incidents per researched company.
# Every researched company counts, including the ones with no incidents (their file name is their ticker).
researched_tickers = [p.stem for p in (ROOT / "data/ethics").glob("*.json")]
companies_per_sector = universe[universe.ticker.isin(researched_tickers)].groupby("sector").size()
per_sector = incidents.groupby("sector").size().div(companies_per_sector).dropna().sort_values()
print("Incidents per company, by sector:\n", per_sector.round(2), "\n")

# 5. CHARTS.
fig, ax = plt.subplots(figsize=(8, 5))
by_cause.sort_values().plot.barh(ax=ax, color="#12305f")
ax.set_title("Incidents found, by cause")
ax.set_xlabel("Number of incidents")
fig.tight_layout()
fig.savefig(OUT / "incidents_by_cause.png", dpi=150)

fig, ax = plt.subplots(figsize=(8, 5))
per_sector.plot.barh(ax=ax, color="#12305f")
ax.set_title("Incidents per researched company, by sector")
ax.set_xlabel("Incidents per company")
fig.tight_layout()
fig.savefig(OUT / "incidents_per_company_by_sector.png", dpi=150)
print("Charts saved in analysis/charts/")
