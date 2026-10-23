import { z } from 'zod';
import { clientProfileSchema } from './profile';
import { vettedCompanySchema } from './vet';

/** Input to the finance module (d): `allocate(input) => Portfolio`. */
export const allocateInputSchema = z.object({
  companies: z.array(vettedCompanySchema),
  profile: clientProfileSchema,
});

export const holdingSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  sector: z.string(),
  /** Fraction of the portfolio, 0..1. All weights sum to 1 (+/- 0.001). */
  weight: z.number().min(0).max(1),
  /** Why this was selected financially. Client-facing sentences. */
  financialReasons: z.array(z.string()),
  /** Why this was selected ethically. Client-facing sentences. */
  ethicalReasons: z.array(z.string()),
  /** Only when necessary: financial or ethical concerns the client should know. */
  flags: z.array(z.string()).default([]),
  /** Free-form numeric metrics for charts, e.g. { pe: 12.1, beta: 0.8, dividendYield: 0.04 }. */
  metrics: z.record(z.string(), z.number()).default({}),
});

/** Output of the finance module. */
export const portfolioSchema = z.object({
  holdings: z.array(holdingSchema),
  summary: z.object({
    expectedReturn: z.number().optional(),
    volatility: z.number().optional(),
    sharpe: z.number().optional(),
    /** Method/assumptions in plain English. */
    methodology: z.string(),
  }),
});

export type AllocateInput = z.infer<typeof allocateInputSchema>;
export type Holding = z.infer<typeof holdingSchema>;
export type Portfolio = z.infer<typeof portfolioSchema>;
