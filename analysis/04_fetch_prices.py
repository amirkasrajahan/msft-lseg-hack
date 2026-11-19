"""Step 4a: download 3 years of daily closing prices for the 97 companies in data/market.json.

Run from the repo root:
    analysis/.venv/bin/pip install yfinance
    analysis/.venv/bin/python analysis/04_fetch_prices.py

Writes analysis/data/prices.csv (one column per ticker). The file is not committed (it is Yahoo's data); this
script rebuilds it. Same ticker rule as scripts/fetch-market.py: LSE code + ".L".
"""
import json
from pathlib import Path

import pandas as pd
import yfinance as yf

ROOT = Path(__file__).resolve().parent.parent
OVERRIDES = {"BT.A": "BT-A.L", "BTA": "BT-A.L", "RDSB": "SHEL.L", "RDSA": "SHEL.L"}

tickers = [a["ticker"] for a in json.loads((ROOT / "data/market.json").read_text())["assets"]]
symbols = {t: OVERRIDES.get(t, f"{t.replace('.', '-')}.L") for t in tickers}
raw = yf.download(list(symbols.values()), period="3y", auto_adjust=True, progress=False)["Close"]
prices = raw.rename(columns={v: k for k, v in symbols.items()}).dropna(axis=1, thresh=500).sort_index()
prices.to_csv(Path(__file__).resolve().parent / "data/prices.csv")
missing = sorted(set(tickers) - set(prices.columns))
print(f"{prices.shape[1]} of {len(tickers)} tickers, {prices.shape[0]} days, {prices.index[0].date()} to {prices.index[-1].date()}")
print("Missing:", missing)
