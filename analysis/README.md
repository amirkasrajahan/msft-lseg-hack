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

## Caveats to state in any write-up

- The evidence covers 110 of 332 companies, found by an AI research pass. Counts reflect what was found and cited, not the true number of incidents.
- Sector groups are small (Real Estate and IT have only a handful of companies), so rates there are noisy.
- Expected returns in `data/market.json` are assumptions, not forecasts.
