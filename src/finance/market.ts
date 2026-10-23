import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

/**
 * The frozen market snapshot, built offline by scripts/fetch-market.py.
 * Nothing in the demo path fetches prices: the demo is reproducible and the
 * numbers can be defended by date and source.
 *
 * Lives here rather than in src/lib/schemas because only finance reads it.
 * Promote it when the pipeline needs to carry it across module boundaries.
 */
export const assetStatsSchema = z.object({
  ticker: z.string(),
  /** Expected annual return, decimal (0.078 = 7.8%). */
  expectedReturn: z.number(),
  /** Annualised standard deviation of returns, decimal. */
  volatility: z.number().nonnegative(),
  /** Income yield where the instrument pays one. Decimal. */
  incomeYield: z.number().optional(),
});

export const marketDataSchema = z
  .object({
    /** Date the snapshot was taken, ISO yyyy-mm-dd. Quote this to the client. */
    asOf: z.string(),
    /** Where the numbers came from, specific enough to re-derive them. */
    source: z.string(),
    /** Annual risk-free rate, decimal. UK: Bank of England Bank Rate. */
    riskFreeRate: z.number(),
    assets: z.array(assetStatsSchema).min(1),
    /** Correlation matrix. Row and column order matches `assets`. */
    correlations: z.array(z.array(z.number().min(-1).max(1))).min(1),
  })
  // Stored as correlations rather than a covariance matrix because these
  // invariants are checkable, so an authoring or fetching mistake is caught
  // here instead of producing a silently wrong portfolio.
  .refine((m) => new Set(m.assets.map((a) => a.ticker)).size === m.assets.length, {
    message: 'duplicate ticker in assets',
  })
  .refine((m) => m.correlations.length === m.assets.length, {
    message: 'correlations must have one row per asset',
  })
  .refine((m) => m.correlations.every((row) => row.length === m.assets.length), {
    message: 'correlations must be square',
  })
  .refine((m) => m.correlations.every((row, i) => Math.abs(row[i] - 1) < 1e-6), {
    message: 'correlation matrix diagonal must be 1',
  })
  .refine(
    (m) => m.correlations.every((row, i) => row.every((v, j) => Math.abs(v - m.correlations[j][i]) < 1e-6)),
    { message: 'correlation matrix must be symmetric' },
  );

export type AssetStats = z.infer<typeof assetStatsSchema>;
export type MarketData = z.infer<typeof marketDataSchema>;

let cached: MarketData | null = null;

/** Reads and validates data/market.json once per process. */
export async function loadMarket(relPath = 'data/market.json'): Promise<MarketData> {
  if (cached) return cached;
  const text = await readFile(path.join(process.cwd(), relPath), 'utf8');
  cached = marketDataSchema.parse(JSON.parse(text));
  return cached;
}

/** Which of `tickers` the snapshot can price. Order preserved. */
export function priced(market: MarketData, tickers: string[]): string[] {
  const known = new Set(market.assets.map((a) => a.ticker));
  return tickers.filter((t) => known.has(t));
}

export interface MarketSlice {
  tickers: string[];
  /** Expected annual returns, same order as `tickers`. */
  mu: number[];
  /** Annualised volatilities, same order as `tickers`. */
  sd: number[];
  /** Covariance matrix: cov[i][j] = rho[i][j] * sd[i] * sd[j]. */
  cov: number[][];
  riskFreeRate: number;
}

/** Statistics for exactly these tickers, in this order. Throws on an unpriced one. */
export function slice(market: MarketData, tickers: string[]): MarketSlice {
  const index = new Map(market.assets.map((a, i) => [a.ticker, i]));
  const rows = tickers.map((t) => {
    const i = index.get(t);
    if (i === undefined) throw new Error(`no market data for ${t}; run scripts/fetch-market.py`);
    return i;
  });
  const sd = rows.map((i) => market.assets[i].volatility);
  return {
    tickers,
    mu: rows.map((i) => market.assets[i].expectedReturn),
    sd,
    cov: rows.map((i, a) => rows.map((j, b) => market.correlations[i][j] * sd[a] * sd[b])),
    riskFreeRate: market.riskFreeRate,
  };
}

/** Annualised volatility of a weighted portfolio: sqrt(w' * cov * w). */
export function portfolioVolatility(weights: number[], cov: number[][]): number {
  let total = 0;
  for (let i = 0; i < weights.length; i++) {
    for (let j = 0; j < weights.length; j++) total += weights[i] * cov[i][j] * weights[j];
  }
  return Math.sqrt(Math.max(total, 0));
}

/** Expected annual return of a weighted portfolio. */
export const portfolioReturn = (weights: number[], mu: number[]): number =>
  weights.reduce((sum, w, i) => sum + w * mu[i], 0);
