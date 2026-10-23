import './_env';
import assert from 'node:assert/strict';
import { RUBRIC, causeScore, incidentScore, rate } from '../src/lib/rubric';
import type { ClientProfile, EthicsRecord, Incident } from '../src/lib/schemas';

/** Smallest check that fails if the rubric logic breaks. Run with `npm run check:rubric`. */
const inc = (o: Partial<Incident> = {}): Incident => ({
  year: 2026, summary: 'Test incident.', severity: 4, relativeScale: 4, confirmed: true, remediation: 0, sources: [], sourceUrls: [], ...o,
});
const profile = (weight: number): ClientProfile => ({
  riskLevel: 3, sectors: { include: [], exclude: [] }, activityExclusions: [],
  causes: [{ causeId: 'climate_emissions', stance: 'avoid', weight }],
});
const record = (incidents: Incident[]): EthicsRecord => ({
  ticker: 'T', generatedAt: '', coverage: 'full', sources: [], causes: { climate_emissions: { incidents, positives: [] } },
});

assert.equal(incidentScore(inc(), 2026), 16, 'recent confirmed unremedied: severity x scale');
assert.equal(incidentScore(inc({ confirmed: false }), 2026), 16 * RUBRIC.allegation, 'allegations weigh less');
assert.equal(incidentScore(inc({ remediation: 1 }), 2026), 0, 'fully remedied scores zero');
assert.ok(incidentScore(inc({ year: 2026 - RUBRIC.halfLifeYears }), 2026) - 8 < 1e-9, 'half-life halves it');
assert.equal(causeScore([inc()], 5, 2026), 16 * (5 / 3), 'weight scales the score');

assert.equal(rate(record([]), profile(3), 2026).status, 'pass', 'no evidence on the cause passes');
assert.equal(rate(record([inc()]), profile(3), 2026).status, 'exclude', 'serious confirmed incident excludes');
assert.equal(rate(record([inc({ severity: 2, relativeScale: 2 })]), profile(3), 2026).status, 'borderline', 'moderate incident is a close call');
assert.equal(rate(record([inc()]), profile(1), 2026).status, 'borderline', 'a nice-to-have cause only makes it a close call (16 x 1/3 = 5.3)');
assert.equal(rate(record([inc()]), profile(5), 2026).status, 'exclude', 'a non-negotiable cause excludes');
