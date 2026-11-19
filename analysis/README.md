# Analysis

Data analysis on the Ethos evidence cache and market data. Separate from the app.

## Setup

```bash
python3 -m venv analysis/.venv
analysis/.venv/bin/pip install pandas matplotlib
analysis/.venv/bin/python analysis/01_incidents.py
```

## Steps

| Step | Script | Question | Skills |
|------|--------|----------|--------|
| 1 | `01_incidents.py` | Which causes and sectors have the most incidents? | JSON to table, join, group by, rates, charts |
| 2 | `02_rubric_sensitivity.py` | If the rubric's settings move, how many companies change outcome? | Rebuilding a rule, validating against a reference, parameter sweep, comparison |
| 3 | `03_market_risk.py` | Which sectors are riskiest, how much do companies move together, how much does diversification help? | Matrices, group averages, heatmap, Monte Carlo simulation |

## Caveats to state in any write-up

- The evidence covers 110 of 332 companies, found by an AI research pass. Counts reflect what was found and cited, not the true number of incidents.
- Sector groups are small (Real Estate and IT have only a handful of companies), so rates there are noisy.
- Expected returns in `data/market.json` are assumptions, not forecasts.

## Step 2 findings: how sensitive is the rubric?

The Python rule was checked against the app's TypeScript `rate()` on the same data and gives identical counts for both demo clients.

- **The two demo clients barely trigger the rule.** The cautious client has 5 close calls and no exclusions, and the second client has none, because they care about few causes. For a fuller test I added two clients that care about every cause.
- **The result depends on the exclusion line.** For a client with all causes at the neutral weight, the current line (8) excludes 12 of 107 rated companies. Line 6 excludes 18 (+50%), line 10 excludes 6 (half). For a strict client the same moves give 36 and 18 against 26.
- **Some settings matter more than others.** For the all-causes client, changing how fast incidents fade (half-life 6 vs 24 years) changes the outcome of 13 and 10 companies, and counting every incident in full instead of half changes 7. Treating allegations differently (0.1 or 0.6) changes only 2 to 3 companies, and switching the severity floor off changes 1.
- **What this means:** the exclusion line and the time decay are the judgement calls worth explaining to a client. The allegation weight and severity floor rarely change outcomes on this data.
- **Limits:** only 107 companies have full evidence, severity and scale come from an AI research pass, and the two extra clients are hypothetical.

Charts: `charts/exclusion_line_sweep.png`, `charts/rubric_sensitivity.png`. Tables: the matching `.csv` files.

## Step 3 findings: risk in the market snapshot

Data: annual volatility and a correlation matrix for 97 FTSE 100 companies, from 3 years of daily prices to 2026-10-23.

- **Typical risk:** the median company has 26% annual volatility, ranging from 14% to 47%.
- **Materials is the riskiest sector** (median 40%), well above the others, which sit between 23% and 28%. Consumer Staples and Utilities are the calmest (23%).
- **Companies in the same sector move together more:** average correlation is 0.30 within a sector and 0.17 between sectors. Holding companies from different sectors reduces risk more.
- **Diversification works, then flattens.** Picking companies at random and holding them equally, typical volatility is 26% with 1 company, 14% with 10, and 12% with 40. Going from 10 to 40 holdings only removes about 2 more points, which is why a portfolio of about 15 to 20 companies is reasonable.
- **Limits:** the sector groups are small (3 to 5 companies for some), correlations come from only 3 years, and these are historical figures, not forecasts.

Charts: `charts/volatility_by_sector.png`, `charts/correlation_heatmap.png`, `charts/diversification.png`.
