"""Step 5: did excluding companies on ethical grounds cost money over the last 3 years?

Run from the repo root (after 04_fetch_prices.py):
    analysis/.venv/bin/python analysis/05_ethics_backtest.py

Method, in plain words:
1. Rate every priced company with the ethics rubric for a client who cares about every cause (weight 5 = strict).
2. Split them into three groups: pass, close call, excluded. Companies with no full evidence record are left out.
3. Hold each group in equal parts for the 3 years and compare growth, yearly return, risk and worst fall.
4. Is the gap just luck? Draw 1,000 random groups of the same size from the same companies and see where
   the excluded group lands among them.

Skills practised: joining two datasets (prices + ratings), returns from prices, cumulative growth,
drawdown, risk-adjusted return, a random-baseline test.

HONEST LIMITS (also in the README): ratings use incidents known today and are applied to past prices (look-ahead),
3 years is a short window, groups are small, and equal weights are not the app's optimised portfolios.
"""
import json
from pathlib import Path

import matplotlib
import numpy as np
import pandas as pd
from rubric import BASE, company_score, status

matplotlib.use("Agg")
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(__file__).resolve().parent / "charts"
RISK_FREE = 0.04  # Bank of England Bank Rate, as in data/market.json

# 1. LOAD prices and ratings, and keep only companies that have both.
prices = pd.read_csv(Path(__file__).resolve().parent / "data/prices.csv", index_col=0, parse_dates=True)
records = {r["ticker"]: r for r in (json.loads(f.read_text()) for f in (ROOT / "data/ethics").glob("*.json")) if r["coverage"] == "full"}
all_causes = sorted({c for r in records.values() for c in r["causes"]})
client = [{"causeId": c, "weight": 5} for c in all_causes]  # a strict institution

rating = pd.Series({t: status(company_score(records[t], client, BASE), BASE) for t in prices.columns if t in records})
unrated = [t for t in prices.columns if t not in records]
print(f"{len(prices.columns)} priced companies; {len(rating)} rated, {len(unrated)} not rated (left out)")
print(rating.value_counts().to_string(), "\n")

# 2. RETURNS. Daily percentage change; a group's day is the average of its members (equal weights).
daily = prices.pct_change().dropna(how="all")
groups = {
    "Passed ethics check": list(rating.index[rating == "pass"]),
    "Close call": list(rating.index[rating == "close call"]),
    "Excluded": list(rating.index[rating == "excluded"]),
    "All rated companies": list(rating.index),
}
series = {name: daily[members].mean(axis=1) for name, members in groups.items()}


def summary(r):
    growth = (1 + r).cumprod()
    years = len(r) / 252
    annual = growth.iloc[-1] ** (1 / years) - 1
    vol = r.std() * np.sqrt(252)
    drawdown = (growth / growth.cummax() - 1).min()  # worst fall from a previous peak
    return {"companies": 0, "annual_return": annual, "volatility": vol, "return_per_risk": (annual - RISK_FREE) / vol, "worst_fall": drawdown}


table = pd.DataFrame({name: summary(r) for name, r in series.items()}).T
table["companies"] = [len(groups[n]) for n in table.index]
pd.set_option("display.width", 200)
print((table.assign(**{c: table[c].map("{:.1%}".format) for c in ["annual_return", "volatility", "worst_fall"]},
                    return_per_risk=table.return_per_risk.map("{:.2f}".format))).to_string(), "\n")
table.to_csv(OUT / "ethics_backtest.csv")

# 3. CHART: growth of 100 invested at the start.
fig, ax = plt.subplots(figsize=(9, 5))
for name, r in series.items():
    ax.plot((1 + r).cumprod() * 100, label=f"{name} ({len(groups[name])})", linewidth=2 if name != "All rated companies" else 1.2,
            linestyle="-" if name != "All rated companies" else "--", color={"Passed ethics check": "#12305f", "Close call": "#d6a840", "Excluded": "#b3402c"}.get(name, "grey"))
ax.set_ylabel("Value of 100 invested at the start")
ax.set_title("Strict ethics rules, equal-weight groups, last 3 years")
ax.legend()
fig.tight_layout()
fig.savefig(OUT / "ethics_backtest_growth.png", dpi=150)

# 4. IS IT LUCK? Random groups the same size as the excluded group, drawn from all rated companies.
n = len(groups["Excluded"])
rng = np.random.default_rng(0)
pool = list(rating.index)
random_returns = np.array([summary(daily[list(rng.choice(pool, size=n, replace=False))].mean(axis=1))["annual_return"] for _ in range(1000)])
excl, ok = table.loc["Excluded", "annual_return"], table.loc["Passed ethics check", "annual_return"]
pct = (random_returns < excl).mean()
print(f"Random groups of {n} companies: yearly return from {np.percentile(random_returns, 5):.1%} to {np.percentile(random_returns, 95):.1%} (middle 90%)")
print(f"The excluded group returned {excl:.1%}, higher than {pct:.0%} of random groups of that size.")
print(f"Passed group {ok:.1%} vs excluded {excl:.1%}: gap {ok - excl:+.1%} a year\n")

fig, ax = plt.subplots(figsize=(8, 5))
ax.hist(random_returns * 100, bins=30, color="#c9d3e6")
ax.axvline(excl * 100, color="#b3402c", linewidth=2, label=f"Excluded group ({excl:.1%})")
ax.axvline(ok * 100, color="#12305f", linewidth=2, label=f"Passed group ({ok:.1%})")
ax.set_xlabel("Yearly return (%)")
ax.set_ylabel(f"Random groups of {n} companies (out of 1,000)")
ax.set_title("Is the gap bigger than luck?")
ax.legend()
fig.tight_layout()
fig.savefig(OUT / "ethics_backtest_luck.png", dpi=150)
print("Charts saved in analysis/charts/")
