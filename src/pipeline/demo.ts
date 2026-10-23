import { useMocks } from '@/lib/env';
import { loadFixture } from '@/lib/fixtures';
import {
  causeById,
  portfolioSchema,
  vetResultSchema,
  type AllocateInput,
  type ClientProfile,
  type Company,
  type Portfolio,
  type ReportSpec,
  type ScreenBucket,
  type ScreenResult,
  type VetDecision,
  type VetResult,
} from '@/lib/schemas';

/**
 * Opt-in demo rules: `USE_MOCKS=1 DEMO_RULES=1`. Makes the mock pipeline react to the client's profile so a
 * demo changes when the client's answers change. This is NOT the real screen, vet or finance logic and makes
 * no financial forecasts; it exists only until the real agents land. Off by default.
 * ponytail: delete this file and its hooks in pipeline/index.ts once the real stages work.
 */
export const demoRules = () => useMocks() && process.env.DEMO_RULES === '1';

const words = (s: string) => s.replace(/_/g, ' ');
const sentence = (s: string) => words(s).replace(/^./, (c) => c.toUpperCase());

export function demoScreen(profile: ClientProfile, universe: Company[]): ScreenResult {
  const buckets = new Map<string, ScreenBucket>();
  const put = (id: string, label: string, rationale: string, action: 'keep' | 'exclude', ticker: string) => {
    const b = buckets.get(id) ?? { id, label, rationale, action, tickers: [] };
    b.tickers.push(ticker);
    buckets.set(id, b);
  };

  for (const c of universe) {
    const tag = c.activityTags.find((t) => profile.activityExclusions.includes(t));
    if (tag) put(`tag-${tag}`, sentence(tag), `You refuse ${words(tag)}.`, 'exclude', c.ticker);
    else if (profile.sectors.exclude.includes(c.sector)) {
      put(`sector-${c.sector}`, c.sector, `You excluded the ${c.sector} sector.`, 'exclude', c.ticker);
    } else if (profile.sectors.include.length && !profile.sectors.include.includes(c.sector)) {
      put('outside', 'Outside your preferred sectors', `You only want ${profile.sectors.include.join(', ')}.`, 'exclude', c.ticker);
    } else {
      put(`keep-${c.sector}`, c.sector, 'Allowed by your rules; will be vetted on your causes next.', 'keep', c.ticker);
    }
  }

  const all = [...buckets.values()].sort((a, b) => (a.action === b.action ? 0 : a.action === 'exclude' ? -1 : 1));
  const kept = all.filter((b) => b.action === 'keep').reduce((n, b) => n + b.tickers.length, 0);
  return {
    buckets: all,
    summary: `${universe.length - kept} of ${universe.length} companies excluded on your sector and activity rules; ${kept} continue to ethical vetting.`,
  };
}

/** Uses the fixture ethics decisions, but only for causes the client cares about. A non-negotiable cause turns a close call into an exclusion. */
export async function demoVet(profile: ClientProfile, kept: string[]): Promise<VetResult> {
  const base = await loadFixture('vet-result.json', vetResultSchema);
  const weight = new Map(profile.causes.map((c) => [c.causeId, c.weight]));
  const applies = (d: VetDecision) => kept.includes(d.ticker) && weight.has(d.causeId);

  const excluded = base.excluded.filter(applies);
  const borderline: VetDecision[] = [];
  for (const d of base.borderline.filter(applies)) {
    if (weight.get(d.causeId) === 5) {
      excluded.push({ ...d, reason: `${d.reason} You marked ${causeById(d.causeId).label.toLowerCase()} as non-negotiable, so this is excluded.` });
    } else borderline.push(d);
  }
  const flagged = new Set([...borderline, ...excluded].map((d) => d.ticker));
  const passed = kept.filter((t) => !flagged.has(t));
  return {
    passed,
    borderline,
    excluded,
    summary: `${excluded.length} excluded, ${borderline.length} borderline accepted, ${passed.length} passed cleanly.`,
  };
}

/** Weights favour low-beta companies for cautious clients and high-beta for aggressive ones. No return or risk forecasts. */
export async function demoAllocate({ companies, profile }: AllocateInput): Promise<Portfolio> {
  const template = new Map((await loadFixture('portfolio.json', portfolioSchema)).holdings.map((h) => [h.ticker, h]));
  const tilt = (profile.riskLevel - 3) * 1.5;
  const raw = companies.map((c) => Math.exp(tilt * ((template.get(c.ticker)?.metrics.beta ?? 1) - 0.8)));
  const total = raw.reduce((a, b) => a + b, 0);
  const weights = raw.map((r) => Math.round((r / total) * 1000) / 1000);
  const biggest = weights.indexOf(Math.max(...weights));
  weights[biggest] = Math.round((weights[biggest] + 1 - weights.reduce((a, b) => a + b, 0)) * 1000) / 1000;

  return {
    holdings: companies.map((c, i) => {
      const t = template.get(c.ticker);
      const conflicts = c.activityTags.filter((tag) => profile.activityExclusions.includes(tag));
      return {
        ticker: c.ticker,
        name: c.name,
        sector: c.sector,
        weight: weights[i],
        financialReasons: t?.financialReasons ?? [c.description],
        ethicalReasons: t?.ethicalReasons ?? (c.ethicalNotes.length ? c.ethicalNotes : ['Passed the ethics check on your causes.']),
        flags: [
          ...(c.borderlineReason ? [`Accepted despite a concern: ${c.borderlineReason}`] : []),
          ...(conflicts.length ? [`Conflicts with a rule you set (${conflicts.map(words).join(', ')}); you overruled the screen.`] : []),
        ],
        metrics: t?.metrics ?? {},
      };
    }),
    summary: {
      methodology:
        'Demo rule, not a financial model: companies that passed are weighted by how defensive they are (market beta), tilted by the client risk level. No return or risk forecasts are made.',
    },
  };
}

const RISK_WORDS = ['very cautious', 'cautious', 'balanced', 'growth-focused', 'very aggressive'];

export function demoReport(input: { profile: ClientProfile; vet: VetResult; portfolio: Portfolio }): ReportSpec {
  const { profile, vet, portfolio } = input;
  const n = portfolio.holdings.length;
  const top = [...portfolio.holdings].sort((a, b) => b.weight - a.weight)[0];
  const sections: ReportSpec['sections'] = [
    {
      component: 'ExecutiveSummary',
      props: {
        headline: `A ${RISK_WORDS[profile.riskLevel - 1]} portfolio of ${n} ${n === 1 ? 'company' : 'companies'}`,
        narrative: `Companies were screened on your sector and activity rules and checked against your causes. ${n} remain, weighted for a risk level of ${profile.riskLevel} of 5.`,
      },
    },
    {
      component: 'RiskProfileCard',
      props: { narrative: `A risk level of ${profile.riskLevel} of 5 means ${profile.riskLevel <= 2 ? 'favouring stable, steadier companies' : profile.riskLevel >= 4 ? 'accepting bigger swings for more growth' : 'a middle path between stability and growth'}.` },
    },
    { component: 'AllocationDonut', props: { title: 'Where your money goes' } },
    { component: 'SectorBreakdown', props: { title: 'Sector exposure' } },
    {
      component: 'EthicalScreeningSummary',
      props: { narrative: `${vet.excluded.length} ${vet.excluded.length === 1 ? 'company was' : 'companies were'} excluded on the ethics check, ${vet.borderline.length} accepted with concerns, and ${vet.passed.length} passed cleanly.` },
    },
    {
      component: 'BorderlineDecisions',
      props: { narrative: vet.borderline.length ? 'These were close calls. They are in the portfolio, and you can still exclude them.' : 'No company needed a close call.' },
    },
    { component: 'HoldingsTable', props: { title: 'All holdings', showReasons: true } },
    ...(top ? [{ component: 'HoldingDeepDive' as const, props: { ticker: top.ticker, narrative: `Your largest position, at ${(top.weight * 100).toFixed(1)}% of the portfolio.` } }] : []),
    { component: 'RiskFlags', props: { narrative: 'Anything flagged below is something to look at twice before you invest.' } },
  ];
  return { title: 'Your Ethical Portfolio', sections };
}
