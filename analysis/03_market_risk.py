"""Step 3: risk in the market snapshot. Which sectors are riskiest, how much do companies move together,
and how much does diversification help?

Run from the repo root:
    analysis/.venv/bin/python analysis/03_market_risk.py

Data: data/market.json holds, for 97 FTSE 100 companies, an annual volatility and a 97 x 97 correlation matrix,
both estimated from 3 years of daily prices. (Its expected returns are assumptions, so we do not analyse them.)

Skills practised: building a matrix, grouping by category, within-group vs between-group averages, a heatmap,
and a small Monte Carlo simulation (random draws, repeated many times).
"""
import json
from pathlib import Path

import matplotlib
import numpy as np
import pandas as pd

matplotlib.use("Agg")
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(__file__).resolve().parent / "charts"

# 1. LOAD. One row per company, plus the correlation matrix as a labelled table.
market = json.loads((ROOT / "data/market.json").read_text())
assets = pd.DataFrame(market["assets"])
universe = pd.DataFrame(json.loads((ROOT / "data/universe.json").read_text()))
assets = assets.merge(universe[["ticker", "name", "sector"]], on="ticker", how="left")
corr = pd.DataFrame(market["correlations"], index=assets.ticker, columns=assets.ticker)
print(f"{len(assets)} companies, prices to {market['asOf']}")
print(f"Median annual volatility: {assets.volatility.median():.0%} "
      f"(lowest {assets.volatility.min():.0%}, highest {assets.volatility.max():.0%})\n")

# 2. RISK BY SECTOR. Volatility is how much a share's price moves in a year. Median is robust to one wild company.
by_sector = (
    assets.groupby("sector").volatility.agg(companies="size", median_volatility="median").sort_values("median_volatility")
)
print("Volatility by sector:\n", by_sector.round(2).to_string(), "\n")

fig, ax = plt.subplots(figsize=(8, 5))
by_sector.median_volatility.plot.barh(ax=ax, color="#12305f")
ax.set_xlabel("Median annual volatility")
ax.set_ylabel("")
ax.set_title("Which sectors have the riskiest shares?")
for i, (v, n) in enumerate(zip(by_sector.median_volatility, by_sector.companies)):
    ax.text(v + 0.003, i, f"{v:.0%}  (n={n})", va="center", fontsize=8)
ax.set_xlim(0, by_sector.median_volatility.max() * 1.25)
fig.tight_layout()
fig.savefig(OUT / "volatility_by_sector.png", dpi=150)

# 3. HOW MUCH DO COMPANIES MOVE TOGETHER? Average correlation of pairs in the same sector vs different sectors.
sector = assets.set_index("ticker").sector
same = np.equal.outer(sector.values, sector.values)
pairs = np.triu(np.ones_like(same, dtype=bool), k=1)  # each pair once, no self-pairs
vals = corr.values
within, between = vals[same & pairs].mean(), vals[~same & pairs].mean()
print(f"Average correlation, same sector: {within:.2f}; different sectors: {between:.2f}\n")

order = sector.sort_values().index  # group the matrix by sector so blocks show up
fig, ax = plt.subplots(figsize=(8, 7))
im = ax.imshow(corr.loc[order, order], cmap="Blues", vmin=0, vmax=1)
ax.set_xticks([]), ax.set_yticks([])
ax.set_title("How closely company prices move together (sorted by sector)")
fig.colorbar(im, ax=ax, label="Correlation")
fig.tight_layout()
fig.savefig(OUT / "correlation_heatmap.png", dpi=150)

# 4. DIVERSIFICATION. Pick N companies at random, hold them equally, work out the portfolio's volatility
# (sqrt of w' * covariance * w), and repeat 500 times for each N.
vol = assets.set_index("ticker").volatility.reindex(corr.index).values
cov = corr.values * np.outer(vol, vol)
rng = np.random.default_rng(0)
rows = []
for n in range(1, 41):
    results = []
    for _ in range(500):
        idx = rng.choice(len(vol), size=n, replace=False)
        w = np.full(n, 1 / n)
        results.append(np.sqrt(w @ cov[np.ix_(idx, idx)] @ w))
    rows.append({"holdings": n, "median": np.median(results), "low": np.percentile(results, 10), "high": np.percentile(results, 90)})
div = pd.DataFrame(rows).set_index("holdings")
div.to_csv(OUT / "diversification.csv")
one, ten, forty = div.loc[1, "median"], div.loc[10, "median"], div.loc[40, "median"]
print(f"Typical portfolio volatility: 1 company {one:.0%}, 10 companies {ten:.0%}, 40 companies {forty:.0%}")
print(f"Going from 10 to 40 holdings cuts risk by only {ten - forty:.1%} points more.\n")

fig, ax = plt.subplots(figsize=(8, 5))
ax.fill_between(div.index, div.low, div.high, alpha=0.2, color="#12305f", label="Middle 80% of random portfolios")
ax.plot(div.index, div["median"], color="#12305f", label="Median")
ax.set_xlabel("Number of companies held (equal weights)")
ax.set_ylabel("Annual volatility of the portfolio")
ax.set_title("Diversification: risk falls fast, then flattens")
ax.legend()
fig.tight_layout()
fig.savefig(OUT / "diversification.png", dpi=150)
print("Charts saved in analysis/charts/")
