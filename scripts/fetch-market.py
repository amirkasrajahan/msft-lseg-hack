"""Build data/market.json: the frozen market snapshot the optimiser reads.

Offline only. Nothing in the demo path fetches prices, so a demo is reproducible
and the numbers can be defended by date and source.

    pip install yfinance
    python3 scripts/fetch-market.py --index FTSE100 --years 3

Writes expected returns, volatilities and a correlation matrix for every ticker
in data/universe.json that Yahoo has enough history for. Tickers it cannot
price are reported and skipped, never silently guessed.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import pathlib
import sys

import numpy as np
import pandas as pd

ROOT = pathlib.Path(__file__).resolve().parent.parent
TRADING_DAYS = 252

# LSE tickers are "<code>.L" on Yahoo, but a few carry a class suffix that Yahoo
# writes with a hyphen. Add to this map when the script reports a miss.
SYMBOL_OVERRIDES = {"BT.A": "BT-A.L", "BTA": "BT-A.L", "RDSB": "SHEL.L", "RDSA": "SHEL.L"}

# Bank of England Bank Rate. Quote the date you ran this to the client.
DEFAULT_RISK_FREE = 0.0400


def yahoo_symbol(ticker: str) -> str:
    return SYMBOL_OVERRIDES.get(ticker, f"{ticker.replace('.', '-')}.L")


def shrink_to_psd(corr: np.ndarray) -> tuple[np.ndarray, float]:
    """Mean-variance optimisation needs a positive semi-definite matrix.

    Sampling noise, and any gap-filling above, can push a sample correlation
    matrix slightly indefinite. Shrink toward the identity until it is not.
    """
    n = len(corr)
    lam = 1.0
    while lam > 0 and np.linalg.eigvalsh(lam * corr + (1 - lam) * np.eye(n)).min() < 1e-8:
        lam -= 0.01
    out = lam * corr + (1 - lam) * np.eye(n)
    np.fill_diagonal(out, 1.0)
    return out, lam


def shrink_returns(mu: np.ndarray, intensity: float) -> np.ndarray:
    """Pull expected returns toward their cross-sectional mean.

    A three-year sample mean is not a forecast. Run raw on FTSE 100 data to
    October 2026 it claims 42% a year for Rolls-Royce and 40% for Fresnillo,
    purely because those shares had an exceptional run, and mean-variance
    optimisation then bets the portfolio on them. Shrinking hard toward the
    cross-sectional average is the standard, cheap defence: it keeps the
    ordering while refusing to treat a lucky three years as an expectation.

    The default of 0.8 is deliberately aggressive. Say so to the client.
    """
    return (1 - intensity) * mu + intensity * mu.mean()


def recentre(mu: np.ndarray, risk_free: float, premium: float) -> np.ndarray:
    """Anchor the average expected return to a long-run assumption.

    Shrinkage fixes the spread between shares but not the level: three strong
    years lift every estimate together, and the raw FTSE 100 average to October
    2026 is around 19% a year. No adviser would put that in front of a charity.

    Re-centring keeps each share's position relative to the others and moves the
    whole set so the average equals the risk-free rate plus an assumed equity
    risk premium. This is what a capital market assumption is, and it is the
    number to defend to the client -- not the sample mean.
    """
    return mu - mu.mean() + (risk_free + premium)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--index", default="FTSE100", help="universe filter, or 'all'")
    ap.add_argument("--years", type=int, default=3)
    ap.add_argument("--risk-free", type=float, default=DEFAULT_RISK_FREE)
    ap.add_argument("--shrink", type=float, default=0.8, help="0 = raw sample means, 1 = all equal")
    ap.add_argument(
        "--equity-premium", type=float, default=0.045,
        help="long-run equity risk premium over the risk-free rate; the average "
             "expected return is re-centred on risk_free + this. Pass 0 to keep the sample level.",
    )
    ap.add_argument("--min-days", type=int, default=400, help="minimum observations to keep a ticker")
    ap.add_argument("--out", default="data/market.json")
    args = ap.parse_args()

    try:
        import yfinance as yf
    except ImportError:
        print("yfinance is not installed.  pip install yfinance", file=sys.stderr)
        return 1

    universe = json.loads((ROOT / "data/universe.json").read_text())
    if args.index != "all":
        universe = [c for c in universe if c.get("index") == args.index]
    if not universe:
        print(f"no companies with index={args.index}", file=sys.stderr)
        return 1

    tickers = [c["ticker"] for c in universe]
    symbols = {t: yahoo_symbol(t) for t in tickers}
    print(f"{len(tickers)} tickers in {args.index}, downloading {args.years}y of daily prices...")

    raw = yf.download(
        list(symbols.values()), period=f"{args.years}y", auto_adjust=True,
        progress=False, threads=True,
    )
    close = raw["Close"] if isinstance(raw.columns, pd.MultiIndex) else raw
    close = close.dropna(axis=1, how="all")

    # Keep tickers with enough history; a short series makes a meaningless covariance.
    usable, dropped = {}, {}
    for t, sym in symbols.items():
        if sym not in close.columns:
            dropped[t] = "no data from Yahoo"
            continue
        series = close[sym].dropna()
        if len(series) < args.min_days:
            dropped[t] = f"only {len(series)} observations"
            continue
        usable[t] = sym

    if len(usable) < 2:
        print("fewer than two usable tickers, cannot build a covariance matrix", file=sys.stderr)
        return 1

    kept = sorted(usable)
    prices = close[[usable[t] for t in kept]].dropna()
    returns = prices.pct_change().dropna()

    mu = returns.mean().to_numpy() * TRADING_DAYS
    sd = returns.std().to_numpy() * np.sqrt(TRADING_DAYS)
    mu = shrink_returns(mu, args.shrink)
    if args.equity_premium:
        mu = recentre(mu, args.risk_free, args.equity_premium)
    corr, lam = shrink_to_psd(returns.corr().to_numpy())

    market = {
        "asOf": dt.date.today().isoformat(),
        "source": (
            f"Yahoo Finance daily adjusted closes, {args.years}y to "
            f"{prices.index[-1].date().isoformat()}, {len(prices)} overlapping observations. "
            f"Expected returns are annualised sample means shrunk {args.shrink:.0%} toward the "
            f"cross-sectional mean, then re-centred so the average equals the risk-free rate plus "
            f"an assumed equity risk premium of {args.equity_premium:.1%}. They are assumptions, "
            f"not forecasts. Risk-free rate is the Bank of England Bank Rate. "
            f"Correlations shrunk {1 - lam:.0%} toward the identity for positive semi-definiteness."
        ),
        "riskFreeRate": args.risk_free,
        "assets": [
            {"ticker": t, "expectedReturn": round(float(mu[i]), 6), "volatility": round(float(sd[i]), 6)}
            for i, t in enumerate(kept)
        ],
        "correlations": [[round(float(v), 4) for v in row] for row in corr],
    }

    out = ROOT / args.out
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(market, indent=2) + "\n")

    print(f"\nwrote {args.out}: {len(kept)} tickers, {len(prices)} overlapping days")
    print(f"  expected return  {mu.min()*100:6.2f}% to {mu.max()*100:6.2f}%")
    print(f"  volatility       {sd.min()*100:6.2f}% to {sd.max()*100:6.2f}%")
    print(f"  correlation shrinkage toward identity: {1 - lam:.0%}")
    if dropped:
        print(f"\n{len(dropped)} tickers skipped (no allocation possible for these):")
        for t, why in sorted(dropped.items()):
            print(f"  {t:<8} {why}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
