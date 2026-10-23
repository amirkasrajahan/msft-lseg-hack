import { NotImplementedError } from '@/lib/not-implemented';
import type { AllocateInput, Portfolio } from '@/lib/schemas';

/**
 * Financial recommendation module (d). Owner: finance.
 * Contract: pure-ish function, vetted companies + client profile in, Portfolio out.
 * Weights must sum to 1 and every holding needs financialReasons + ethicalReasons.
 * Validate your output with portfolioSchema before returning.
 */
export async function allocate(_input: AllocateInput): Promise<Portfolio> {
  throw new NotImplementedError('finance allocate()');
}
