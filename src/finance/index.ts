import { portfolioSchema, type AllocateInput, type Portfolio, type VettedCompany } from '@/lib/schemas';
import { loadMarket, portfolioReturn, portfolioVolatility, slice, type MarketData } from './market';
import { maximiseReturnUnderVolatility } from './optimise';

/**
 * Financial recommendation module (d). Owner: finance.
 *
 * Ethical eligibility is settled before this runs and is never traded off
 * against return: whatever arrives in `input.companies` is allowed, and this
 * module only decides how much of the money goes where.
 *
 * The client's horizon becomes a volatility budget, and we take the highest
 * expected return that fits inside it. Prices come from the frozen snapshot in
 * data/market.json, so the same client always gets the same portfolio.
 */

/**
 * Opt in to the real optimiser with REAL_FINANCE=1.
 *
 * Off by default, so REAL_DATA mode keeps using the placeholder allocation in
 * src/pipeline/real.ts and nobody else's setup changes. Remove the flag, and
 * this branch, once the team agrees to switch over.
 */
export const realFinance = () => process.env.REAL_FINANCE === '1';

/** Cash is not in the universe; it is synthesised here so low-risk budgets are reachable. */
const CASH = {
  ticker: 'CASH',
  name: 'Cash (Bank of England Bank Rate)',
  sector: 'Cash',
  /** Instant-access deposits are not literally riskless, but close enough at this horizon. */
  volatility: 0.005,
};

/** No single company above this share, whatever the optimiser would prefer. */
const MAX_PER_COMPANY = 0.10;
/** Below this, a holding is noise: dealing costs exceed any diversification it adds. */
const MIN_WEIGHT = 0.005;

/**
 * Risk level to volatility budget. 1, 3 and 5 are the three horizons the client
 * is offered; 2 and 4 interpolate so every profile value resolves.
 */
const VOLATILITY_BUDGET: Record<number, number> = { 1: 0.03, 2: 0.05, 3: 0.08, 4: 0.11, 5: 0.15 };

export const HORIZONS = [
  { riskLevel: 1, id: 'reserves', label: 'Operating reserves', horizon: 'Needed within 2 years' },
  { riskLevel: 3, id: 'project', label: 'Project funds', horizon: 'Needed in 3 to 7 years' },
  { riskLevel: 5, id: 'endowment', label: 'Permanent endowment', horizon: 'Invested for 10 years or more' },
] as const;

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

function financialReasons(isCash: boolean, mu: number, sd: number, weight: number): string[] {
  if (isCash) {
    return [
      `Earns ${pct(mu)} at the Bank Rate.`,
      'Can be drawn on at any time without having to sell an investment at a loss.',
    ];
  }
  const reasons = [`Expected return ${pct(mu)} a year, with volatility of ${pct(sd)}.`];
  if (weight >= MAX_PER_COMPANY - 1e-6) {
    reasons.push(`Held at the ${pct(MAX_PER_COMPANY)} position limit, which caps single-company risk.`);
  }
  return reasons;
}

function ethicalReasons(company: VettedCompany): string[] {
  if (company.ethicalNotes.length) return company.ethicalNotes;
  return ['Passed your industry exclusions and the evidence review with no outstanding concern.'];
}

/**
 * Allocate across the vetted companies for one risk level.
 * Throws if the market snapshot cannot price enough of them to build anything.
 */
export async function allocate(input: AllocateInput): Promise<Portfolio> {
  const market = await loadMarket();
  return allocateWithMarket(input, market);
}

/** The three horizon portfolios, from one snapshot read. */
export async function allocateHorizons(
  input: AllocateInput,
): Promise<{ horizon: (typeof HORIZONS)[number]; portfolio: Portfolio }[]> {
  const market = await loadMarket();
  return HORIZONS.map((horizon) => ({
    horizon,
    portfolio: allocateWithMarket({ ...input, profile: { ...input.profile, riskLevel: horizon.riskLevel } }, market),
  }));
}

function allocateWithMarket(input: AllocateInput, market: MarketData): Portfolio {
  const { companies, profile } = input;
  const budget = VOLATILITY_BUDGET[profile.riskLevel] ?? VOLATILITY_BUDGET[3];

  const known = new Set(market.assets.map((a) => a.ticker));
  const eligible = companies.filter((c) => known.has(c.ticker));
  const unpriced = companies.filter((c) => !known.has(c.ticker)).map((c) => c.ticker);
  if (!eligible.length) {
    throw new Error(
      `none of the ${companies.length} eligible companies are in data/market.json; ` +
        `run scripts/fetch-market.py`,
    );
  }

  // Cash sits alongside the equities as an uncorrelated, near-riskless line.
  // Without it no equity-only universe can get near a short-horizon budget.
  const tickers = eligible.map((c) => c.ticker);
  const stats = slice(market, tickers);
  const n = tickers.length;
  const mu = [...stats.mu, market.riskFreeRate];
  const sd = [...stats.sd, CASH.volatility];
  const cov = [
    ...stats.cov.map((row) => [...row, 0]),
    [...new Array<number>(n).fill(0), CASH.volatility * CASH.volatility],
  ];
  const caps = [...new Array<number>(n).fill(MAX_PER_COMPANY), 1];

  const solution = maximiseReturnUnderVolatility(mu, cov, budget, caps, market.riskFreeRate);

  // Drop the dust, then solve again over exactly the holdings that survived.
  // Simply rescaling the remainder would lift every holding proportionally,
  // pushing any line already at its position limit above it, and would leave
  // the portfolio a basis point or two outside the volatility budget this
  // function promises. Re-solving with the dropped names capped at zero costs
  // one more pass and makes the promise true.
  // A wide universe can leave every weight under the threshold, so only trim
  // when something survives it.
  const trimmed = solution.weights.map((w) => (w < MIN_WEIGHT ? 0 : w));
  const survives = trimmed.some((w) => w > 0);
  const refined = survives
    ? maximiseReturnUnderVolatility(
        mu,
        cov,
        budget,
        caps.map((c, i) => (trimmed[i] > 0 ? c : 0)),
        market.riskFreeRate,
      )
    : solution;
  const weights = refined.weights.map((w) => (w < MIN_WEIGHT ? 0 : w));

  const holdings = weights
    .map((weight, i) => {
      if (weight === 0) return null;
      const isCash = i === n;
      const company = isCash ? null : eligible[i];
      return {
        ticker: isCash ? CASH.ticker : company!.ticker,
        name: isCash ? CASH.name : company!.name,
        sector: isCash ? CASH.sector : company!.sector,
        weight: Math.round(weight * 10000) / 10000,
        financialReasons: financialReasons(isCash, mu[i], sd[i], weight),
        ethicalReasons: isCash
          ? ['Held as a deposit, so it funds no company and carries no ethical exposure.']
          : ethicalReasons(company!),
        flags: !isCash && company!.borderlineReason ? [company!.borderlineReason] : [],
        metrics: { expectedReturn: mu[i], volatility: sd[i] },
      };
    })
    .filter((h): h is NonNullable<typeof h> => h !== null)
    .sort((a, b) => b.weight - a.weight);

  // Rounding each weight to four places leaves a few basis points unallocated.
  // They go to cash if it is held, otherwise to whichever holding has the most
  // room left under its limit. Sending them to the largest line would push a
  // company already at the limit past it.
  const residual = 1 - holdings.reduce((s, h) => s + h.weight, 0);
  const sink =
    holdings.find((h) => h.ticker === CASH.ticker) ??
    holdings.reduce((most, h) => (h.weight < most.weight ? h : most));
  sink.weight = Math.round((sink.weight + residual) * 10000) / 10000;

  const finalWeights = holdings.map((h) => h.weight);
  const finalCov = holdings.map((h) => {
    const i = h.ticker === CASH.ticker ? n : tickers.indexOf(h.ticker);
    return holdings.map((g) => cov[i][g.ticker === CASH.ticker ? n : tickers.indexOf(g.ticker)]);
  });
  const finalMu = holdings.map((h) => mu[h.ticker === CASH.ticker ? n : tickers.indexOf(h.ticker)]);
  const expectedReturn = portfolioReturn(finalWeights, finalMu);
  const volatility = portfolioVolatility(finalWeights, finalCov);

  const notes = [
    `Highest expected return we could reach without volatility exceeding ${pct(budget)} a year.`,
    `Long only, no borrowing, no single company above ${pct(MAX_PER_COMPANY)}.`,
    `Market data: ${market.source}`,
    `Snapshot taken ${market.asOf}; figures are estimates from past prices, not forecasts.`,
  ];
  if (!refined.capReachable) {
    notes.unshift(
      `No portfolio built from these companies can stay within ${pct(budget)}. This is the ` +
        `calmest one available, at ${pct(volatility)}. Consider a longer horizon or adding bonds.`,
    );
  }
  if (!refined.capBinding) {
    notes.push(`The ${pct(budget)} budget was not the binding constraint; this is simply the best mix available.`);
  }
  if (unpriced.length) {
    notes.push(
      `${unpriced.length} eligible ${unpriced.length === 1 ? 'company has' : 'companies have'} no price ` +
        `history and could not be allocated to: ${unpriced.join(', ')}.`,
    );
  }

  return portfolioSchema.parse({
    holdings,
    summary: {
      expectedReturn,
      volatility,
      sharpe: volatility > 0 ? (expectedReturn - market.riskFreeRate) / volatility : 0,
      methodology: notes.join(' '),
    },
  });
}
