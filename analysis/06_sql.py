"""Step 6: the same questions as Step 1, asked in SQL.

Run from the repo root:
    analysis/.venv/bin/python analysis/06_sql.py

Builds a small SQLite database (analysis/data/ethos.db, not committed) with three tables, then runs queries.
SQLite is in Python's standard library, so nothing extra is needed.

  companies  one row per company in the universe        (ticker, name, sector)
  researched one row per researched company              (ticker, coverage)
  incidents  one row per incident                        (ticker, cause, year, severity, confirmed, remediation)

Skills practised: SELECT, WHERE, GROUP BY, HAVING, JOIN vs LEFT JOIN, CASE, ORDER BY, LIMIT, subqueries,
and a window function (RANK).
"""
import json
import sqlite3
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
DB = Path(__file__).resolve().parent / "data/ethos.db"
DB.parent.mkdir(exist_ok=True)
DB.unlink(missing_ok=True)

# BUILD the tables from the JSON files.
universe = pd.DataFrame(json.loads((ROOT / "data/universe.json").read_text()))[["ticker", "name", "sector"]]
records = [json.loads(f.read_text()) for f in sorted((ROOT / "data/ethics").glob("*.json"))]
researched = pd.DataFrame([{"ticker": r["ticker"], "coverage": r["coverage"]} for r in records])
incidents = pd.DataFrame(
    [
        {"ticker": r["ticker"], "cause": c, "year": i["year"], "severity": i["severity"],
         "confirmed": int(i["confirmed"]), "remediation": i["remediation"]}
        for r in records for c, b in r["causes"].items() for i in b.get("incidents", [])
    ]
)
con = sqlite3.connect(DB)
for name, df in [("companies", universe), ("researched", researched), ("incidents", incidents)]:
    df.to_sql(name, con, index=False)

QUERIES = {
    "1. Incidents by cause (GROUP BY + ORDER BY)": """
        SELECT cause, COUNT(*) AS incidents
        FROM incidents
        GROUP BY cause
        ORDER BY incidents DESC
        LIMIT 5;
    """,
    "2. Share of incidents that are confirmed, by cause (AVG of a 0/1 column, HAVING)": """
        SELECT cause, COUNT(*) AS incidents, ROUND(100.0 * AVG(confirmed), 0) AS pct_confirmed
        FROM incidents
        GROUP BY cause
        HAVING COUNT(*) >= 20          -- ignore causes with too few incidents to compare
        ORDER BY pct_confirmed DESC;
    """,
    "3. Incidents per researched company, by sector (LEFT JOIN keeps companies with no incidents)": """
        SELECT c.sector,
               COUNT(DISTINCT r.ticker) AS researched_companies,
               COUNT(i.cause)           AS incidents,
               ROUND(1.0 * COUNT(i.cause) / COUNT(DISTINCT r.ticker), 2) AS per_company
        FROM researched r
        JOIN companies c ON c.ticker = r.ticker
        LEFT JOIN incidents i ON i.ticker = r.ticker
        GROUP BY c.sector
        ORDER BY per_company DESC;
    """,
    "4. Companies with no incident on record (subquery)": """
        SELECT COUNT(*) AS companies_with_no_incidents
        FROM researched
        WHERE ticker NOT IN (SELECT DISTINCT ticker FROM incidents);
    """,
    "5. Severity buckets (CASE)": """
        SELECT CASE WHEN severity >= 4 THEN 'serious (4-5)'
                    WHEN severity >= 2 THEN 'moderate (2-3)'
                    ELSE 'minor (1)' END AS band,
               COUNT(*) AS incidents,
               ROUND(100.0 * AVG(confirmed), 0) AS pct_confirmed
        FROM incidents
        GROUP BY band
        ORDER BY MIN(severity) DESC;
    """,
    "6. Top company in each sector by incident count (window function RANK)": """
        WITH counts AS (
            SELECT c.sector, c.name, COUNT(*) AS incidents
            FROM incidents i JOIN companies c ON c.ticker = i.ticker
            GROUP BY c.sector, c.name
        )
        SELECT sector, name, incidents
        FROM (SELECT *, RANK() OVER (PARTITION BY sector ORDER BY incidents DESC) AS rnk FROM counts)
        WHERE rnk = 1
        ORDER BY incidents DESC
        LIMIT 6;
    """,
}
pd.set_option("display.width", 200)
for title, sql in QUERIES.items():
    print(title)
    print(pd.read_sql_query(sql, con).to_string(index=False), "\n")
con.close()
