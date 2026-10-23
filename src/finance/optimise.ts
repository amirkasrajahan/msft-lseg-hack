import { portfolioReturn, portfolioVolatility } from './market';

/**
 * Long-only mean-variance optimisation under a volatility budget.
 *
 * The client picks an investment horizon, which becomes a volatility cap. For
 * each cap we solve the same problem — maximise expected return subject to
 * volatility <= cap, weights non-negative and summing to 1, no holding above
 * its own position limit. The answers are points on one efficient frontier, so
 * none can dominate another: each is optimal for its own budget.
 *
 * Deterministic: the same inputs always produce the same portfolio, which a
 * demo depends on. No random restarts.
 */

export interface Solution {
  weights: number[];
  expectedReturn: number;
  volatility: number;
  sharpe: number;
  /** False when even the calmest portfolio in this universe exceeds the cap. */
  capReachable: boolean;
  /** False when the cap never binds, i.e. the unconstrained optimum is calmer. */
  capBinding: boolean;
}

/**
 * Euclidean projection onto { w : 0 <= w_i <= caps_i, sum(w) = 1 }.
 *
 * Caps are per asset, not one number for all of them: a limit that stops the
 * portfolio concentrating in a single company must not also stop it holding
 * cash, which is the only thing that can bring volatility down to a level a
 * charity's operating reserves can accept.
 *
 * Every clamped weight has the form clamp(v_i - tau, 0, caps_i), and their sum
 * falls monotonically as tau rises, so bisecting on tau lands on the simplex.
 */
export function projectCappedSimplex(v: number[], caps: number[]): number[] {
  const headroom = caps.reduce((s, c) => s + c, 0);
  if (headroom < 1 - 1e-9) {
    throw new Error(
      `cannot build a portfolio: the position limits allow at most ` +
        `${(headroom * 100).toFixed(0)}% of the money to be invested. ` +
        `Raise the limits or widen the eligible universe.`,
    );
  }
  const total = (tau: number) =>
    v.reduce((s, x, i) => s + Math.min(Math.max(x - tau, 0), caps[i]), 0);

  let lo = Math.min(...v) - 1;
  let hi = Math.max(...v);
  // 30 halvings take the bracket below 1e-9, far finer than any weight needs.
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (total(mid) > 1) lo = mid;
    else hi = mid;
  }
  const tau = (lo + hi) / 2;
  const w = v.map((x, i) => Math.min(Math.max(x - tau, 0), caps[i]));
  const sum = w.reduce((s, x) => s + x, 0);
  return w.map((x) => x / sum);
}

/** Upper bound on the spectral norm of a symmetric matrix, for a safe step size. */
const maxRowSum = (m: number[][]): number =>
  Math.max(...m.map((row) => row.reduce((s, x) => s + Math.abs(x), 0)));

/**
 * Maximise mu'w - lambda * w'Sigma w over the capped simplex, by projected
 * gradient ascent. A larger lambda means a calmer portfolio.
 *
 * `start` warm-starts from a neighbouring solution. The caller sweeps lambda,
 * where consecutive solutions are close, so this cuts the work by an order of
 * magnitude and keeps the whole stage inside a web request.
 */
function maxUtility(
  mu: number[],
  cov: number[][],
  lambda: number,
  caps: number[],
  start?: number[],
): number[] {
  const n = mu.length;
  let w = projectCappedSimplex(start ?? new Array<number>(n).fill(1 / n), caps);
  const step = 1 / (2 * lambda * maxRowSum(cov) + 1e-9);

  // Nesterov acceleration: the gradient is evaluated at an extrapolated point
  // rather than the current one, which cuts the iteration count roughly
  // threefold on these problems for four extra lines.
  let y = [...w];
  let t = 1;

  for (let iter = 0; iter < 600; iter++) {
    const next = projectCappedSimplex(
      y.map((yi, i) => {
        let risk = 0;
        for (let j = 0; j < n; j++) risk += cov[i][j] * y[j];
        return yi + step * (mu[i] - 2 * lambda * risk);
      }),
      caps,
    );
    const tNext = (1 + Math.sqrt(1 + 4 * t * t)) / 2;
    const momentum = (t - 1) / tNext;
    y = next.map((x, i) => x + momentum * (x - w[i]));
    t = tNext;

    const move = next.reduce((s, x, i) => s + Math.abs(x - w[i]), 0);
    w = next;
    if (move < 1e-7) break;
  }
  return w;
}

const describe = (weights: number[], mu: number[], cov: number[][], rf: number) => {
  const expectedReturn = portfolioReturn(weights, mu);
  const volatility = portfolioVolatility(weights, cov);
  return { expectedReturn, volatility, sharpe: volatility > 0 ? (expectedReturn - rf) / volatility : 0 };
};

const LAMBDA_BOLD = 1e-3; // effectively return-only
const LAMBDA_CALM = 1e4; // effectively minimum variance

/**
 * Highest expected return whose volatility stays within `volCap`.
 *
 * Volatility falls monotonically as lambda rises, so bisecting on lambda finds
 * the portfolio sitting on the budget. Both ends are reported honestly rather
 * than silently clipped: a cap below this universe's minimum-variance portfolio
 * is unreachable, and a cap above the unconstrained optimum never binds. The
 * caller must tell the client which of those happened.
 */
export function maximiseReturnUnderVolatility(
  mu: number[],
  cov: number[][],
  volCap: number,
  caps: number[],
  riskFreeRate: number,
): Solution {
  const calm = maxUtility(mu, cov, LAMBDA_CALM, caps);
  const calmStats = describe(calm, mu, cov, riskFreeRate);
  if (calmStats.volatility > volCap) {
    return { weights: calm, ...calmStats, capReachable: false, capBinding: true };
  }

  const bold = maxUtility(mu, cov, LAMBDA_BOLD, caps);
  const boldStats = describe(bold, mu, cov, riskFreeRate);
  if (boldStats.volatility <= volCap) {
    return { weights: bold, ...boldStats, capReachable: true, capBinding: false };
  }

  let lo = LAMBDA_BOLD; // too volatile
  let hi = LAMBDA_CALM; // within budget
  let best = calm;
  let warm = bold;
  for (let i = 0; i < 40; i++) {
    const mid = Math.sqrt(lo * hi); // geometric: lambda spans seven orders of magnitude
    const w = maxUtility(mu, cov, mid, caps, warm);
    warm = w;
    const vol = portfolioVolatility(w, cov);
    if (vol > volCap) lo = mid;
    else {
      hi = mid;
      best = w;
      // Sitting on the budget already: refining lambda further changes nothing
      // the client could see.
      if (volCap - vol < 1e-4) break;
    }
  }
  return { weights: best, ...describe(best, mu, cov, riskFreeRate), capReachable: true, capBinding: true };
}

/** The calmest long-only portfolio this universe allows: the floor on risk. */
export function minimumVariance(cov: number[][], caps: number[]): number[] {
  return maxUtility(new Array<number>(cov.length).fill(0), cov, LAMBDA_CALM, caps);
}
