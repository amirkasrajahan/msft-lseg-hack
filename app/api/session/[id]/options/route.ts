import { allocateHorizons } from '@/finance';
import { sessionRoute } from '@/lib/api';
import { loadUniverse } from '@/pipeline';

/** The brief says a charity investing an initial GBP 100,000. */
const INVESTMENT_AMOUNT = 100_000;

/**
 * POST /api/session/:id/options -> { options: [{ horizon, portfolio }] }
 *
 * One portfolio per investment horizon, so the client compares real
 * alternatives instead of being handed a single answer. Does not touch the
 * session: /allocate still stores the one portfolio the rest of the app reads.
 */
export const POST = sessionRoute(
  async (session) => {
    const universe = await loadUniverse();
    const out = new Set(session.vetConfirmation?.forceExclude ?? []);
    const back = new Set(session.vetConfirmation?.forceInclude ?? []);
    const borderline = new Map(session.vet!.borderline.map((d) => [d.ticker, d.reason]));
    const tickers = [...session.vet!.passed, ...borderline.keys(), ...back].filter((t) => !out.has(t));
    const companies = universe
      .filter((c) => tickers.includes(c.ticker))
      .map((c) => ({ ...c, ethicalNotes: [], borderlineReason: borderline.get(c.ticker) }));

    return {
      // The amount is a demo constant: ClientProfile does not carry one, and
      // adding a field to the shared schema is not worth a conflict here.
      investmentAmount: INVESTMENT_AMOUNT,
      options: await allocateHorizons({ companies, profile: session.profile! }),
    };
  },
  { requires: ['profile', 'vet'] },
);
