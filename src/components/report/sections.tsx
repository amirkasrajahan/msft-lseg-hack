import type { ReactNode } from 'react';
import { RISK_LABELS, humanize } from '@/components/flow/ProfileSummary';
import { percentOfLine } from '@/lib/rubric';
import { causeById, type Holding, type VetDecision } from '@/lib/schemas';
import type { ReportComponentProps } from './registry';

/**
 * The report components. Calm by design: one column, hairline dividers, a short summary per section, and the detail
 * (every holding, every reason, every source) behind native <details> so nothing is lost but nothing shouts.
 */

const pct = (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`;
const byWeight = (holdings: Holding[]) => [...holdings].sort((a, b) => b.weight - a.weight);
const SHADES = 6; // donut slices before the rest are grouped as "Other"

/** Free-form metric keys are camelCase; yields and returns arrive as fractions. */
const metricLabel = (k: string) => (k === 'pe' ? 'P/E ratio' : humanize(k.replace(/([A-Z])/g, ' $1').toLowerCase()));
const metricValue = (k: string, v: number) => (/yield|return|volatility|margin|growth/i.test(k) ? pct(v) : String(Number(v.toFixed(2))));

/** The first few rows, with the rest behind "Show N more". */
function Rest<T>({ items, limit, render, label }: { items: T[]; limit: number; render: (item: T, i: number) => ReactNode; label: string }) {
  const tail = items.slice(limit);
  return (
    <>
      {items.slice(0, limit).map(render)}
      {tail.length > 0 && (
        <details className="rp-more">
          <summary>
            Show {tail.length} more {label}
          </summary>
          {tail.map((t, i) => render(t, i + limit))}
        </details>
      )}
    </>
  );
}

function Figures({ items }: { items: [string, string][] }) {
  return (
    <dl className="rp-figures">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

const List = ({ items }: { items: string[] }) => (
  <ul className="rp-list">
    {items.map((r) => (
      <li key={r}>{r}</li>
    ))}
  </ul>
);

export function ExecutiveSummary({ headline, narrative, portfolio }: ReportComponentProps<'ExecutiveSummary'>) {
  const { expectedReturn, volatility, sharpe, methodology } = portfolio.summary;
  const holdings = byWeight(portfolio.holdings);
  const sectors = new Set(holdings.map((h) => h.sector)).size;
  const figures: [string, string][] = [
    ['Holdings', String(holdings.length)],
    ['Sectors', String(sectors)],
    ['Largest holding', holdings[0] ? pct(holdings[0].weight, 0) : '-'],
  ];
  if (expectedReturn !== undefined) figures.push(['Expected return a year', pct(expectedReturn)]);
  if (volatility !== undefined) figures.push(['Volatility', pct(volatility)]);
  if (sharpe !== undefined) figures.push(['Return per unit of risk', sharpe.toFixed(2)]);
  return (
    <section className="rp-lead">
      <h2>{headline}</h2>
      <p className="rp-lede">{narrative}</p>
      <Figures items={figures} />
      <details className="rp-note">
        <summary>How the weights were set</summary>
        <p>{methodology}</p>
      </details>
    </section>
  );
}

export function RiskProfileCard({ narrative, profile }: ReportComponentProps<'RiskProfileCard'>) {
  return (
    <section className="rp-sec">
      <h3>Your profile</h3>
      <p className="rp-risk">
        <span className="dots" role="img" aria-label={`Risk ${profile.riskLevel} of 5`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <i key={n} className={n <= profile.riskLevel ? 'on' : ''} />
          ))}
        </span>
        <b>{RISK_LABELS[profile.riskLevel - 1]}</b>
        <span className="muted">risk {profile.riskLevel} of 5</span>
      </p>
      <p>{narrative}</p>
      {profile.causes.length > 0 && (
        <div className="chips">
          {profile.causes.map((c) => (
            <span key={c.causeId} className="chip">
              {c.stance === 'seek' ? 'Backs' : 'Avoids harm in'} {causeById(c.causeId).label.toLowerCase()}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

export function AllocationDonut({ title, portfolio }: ReportComponentProps<'AllocationDonut'>) {
  const sorted = byWeight(portfolio.holdings);
  const head = sorted.slice(0, SHADES);
  const tail = sorted.slice(SHADES);
  const otherWeight = tail.reduce((s, h) => s + h.weight, 0);
  const slices = [...head.map((h, i) => ({ key: h.ticker, name: h.name, weight: h.weight, colour: `var(--s${i + 1})` })), ...(tail.length ? [{ key: 'other', name: `${tail.length} other holdings`, weight: otherWeight, colour: 'var(--s-other)' }] : [])];

  const R = 54;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <section className="rp-sec">
      <h3>{title}</h3>
      <div className="rp-donut">
        <svg viewBox="0 0 150 150" role="img" aria-label="Portfolio weights by holding">
          <g transform="rotate(-90 75 75)">
            {slices.map((s) => {
              const dash = s.weight * C;
              const el = <circle key={s.key} cx="75" cy="75" r={R} fill="none" stroke={s.colour} strokeWidth="16" strokeDasharray={`${Math.max(0, dash - 1.5)} ${C}`} strokeDashoffset={-offset} />;
              offset += dash;
              return el;
            })}
          </g>
          <text x="75" y="73" textAnchor="middle" fontSize="26" fontWeight="700" fill="currentColor">
            {sorted.length}
          </text>
          <text x="75" y="92" textAnchor="middle" fontSize="11" fill="currentColor" opacity=".6">
            holdings
          </text>
        </svg>
        <ul className="rp-legend">
          {slices.map((s) => (
            <li key={s.key}>
              <i style={{ background: s.colour }} />
              <span>{s.name}</span>
              <b>{pct(s.weight)}</b>
            </li>
          ))}
        </ul>
      </div>
      {tail.length > 0 && (
        <details className="rp-more">
          <summary>See the {tail.length} smaller holdings</summary>
          <ul className="rp-legend plain">
            {tail.map((h) => (
              <li key={h.ticker}>
                <span>{h.name}</span>
                <b>{pct(h.weight)}</b>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

export function SectorBreakdown({ title, portfolio }: ReportComponentProps<'SectorBreakdown'>) {
  const totals = new Map<string, number>();
  for (const h of portfolio.holdings) totals.set(h.sector, (totals.get(h.sector) ?? 0) + h.weight);
  const rows = [...totals].sort((a, b) => b[1] - a[1]);
  const max = rows[0]?.[1] ?? 1;
  return (
    <section className="rp-sec">
      <h3>{title}</h3>
      <div className="rp-bars">
        <Rest
          items={rows}
          limit={5}
          label="sectors"
          render={([sector, w]) => (
            <div key={sector} className="rp-bar">
              <span>{sector}</span>
              <div className="rp-track">
                <div style={{ width: `${(w / max) * 100}%` }} />
              </div>
              <b>{pct(w, 0)}</b>
            </div>
          )}
        />
      </div>
    </section>
  );
}

/** One decision as a closed row; open it to read the full reason. */
function DecisionRow({ d, name }: { d: VetDecision; name: string }) {
  return (
    <details className="rp-item" key={d.ticker}>
      <summary>
        <b>{name}</b>
        <span className="muted">{causeById(d.causeId).label}</span>
        <span className="rp-pct">{percentOfLine(d.score)}% of the exclusion line</span>
      </summary>
      <p>{d.reason}</p>
    </details>
  );
}

export function EthicalScreeningSummary({ narrative, vet, companies }: ReportComponentProps<'EthicalScreeningSummary'>) {
  const figures: [string, string][] = [
    ['Passed', String(vet.passed.length)],
    ['Close calls', String(vet.borderline.length)],
    ['Excluded', String(vet.excluded.length)],
  ];
  if (vet.unrated.length) figures.push(['Not rated', String(vet.unrated.length)]);
  return (
    <section className="rp-sec">
      <h3>The ethics check</h3>
      <p>{narrative}</p>
      <Figures items={figures} />
      {vet.excluded.length > 0 && (
        <>
          <h4>Excluded</h4>
          <Rest items={vet.excluded} limit={4} label="exclusions" render={(d) => <DecisionRow key={d.ticker} d={d} name={companies[d.ticker]?.name ?? d.ticker} />} />
        </>
      )}
    </section>
  );
}

export function BorderlineDecisions({ narrative, vet, portfolio, companies }: ReportComponentProps<'BorderlineDecisions'>) {
  if (vet.borderline.length === 0) return null;
  const name = (t: string) => portfolio.holdings.find((h) => h.ticker === t)?.name ?? companies[t]?.name ?? t;
  return (
    <section className="rp-sec">
      <h3>Close calls</h3>
      <p>{narrative}</p>
      <Rest items={vet.borderline} limit={4} label="close calls" render={(d) => <DecisionRow key={d.ticker} d={d} name={name(d.ticker)} />} />
    </section>
  );
}

function HoldingRow({ h, expandable }: { h: Holding; expandable: boolean }) {
  const summary = (
    <>
      <span className="rp-name">
        <b>{h.name}</b>
        <small>{h.sector}</small>
      </span>
      <span className="rp-track thin">
        <i style={{ width: `${Math.min(100, h.weight * 100 * 4)}%` }} />
      </span>
      <b className="rp-w">{pct(h.weight)}</b>
      {h.flags.length > 0 && <span className="rp-dot" title="Has a flag, open to read it" />}
    </>
  );
  if (!expandable) return <div className="rp-hold flat">{summary}</div>;
  return (
    <details className="rp-hold">
      <summary>{summary}</summary>
      <div className="rp-body">
        <div>
          <h5>Financial case</h5>
          <List items={h.financialReasons} />
        </div>
        <div>
          <h5>Ethical case</h5>
          <List items={h.ethicalReasons} />
        </div>
        {h.flags.length > 0 && (
          <div className="rp-flags">
            <h5>Worth a second look</h5>
            <List items={h.flags} />
          </div>
        )}
      </div>
    </details>
  );
}

export function HoldingsTable({ title, showReasons, portfolio }: ReportComponentProps<'HoldingsTable'>) {
  return (
    <section className="rp-sec">
      <h3>{title}</h3>
      <p className="muted rp-hint">{showReasons ? 'Open a holding to read why it is in the portfolio.' : ''}</p>
      <div className="rp-holdings">
        <Rest items={byWeight(portfolio.holdings)} limit={8} label="holdings" render={(h) => <HoldingRow key={h.ticker} h={h} expandable={showReasons} />} />
      </div>
    </section>
  );
}

export function HoldingDeepDive({ ticker, narrative, portfolio }: ReportComponentProps<'HoldingDeepDive'>) {
  const h = portfolio.holdings.find((x) => x.ticker === ticker);
  if (!h) return null;
  const metrics = Object.entries(h.metrics);
  return (
    <section className="rp-sec">
      <details className="rp-spot">
        <summary>
          In focus: <b>{h.name}</b> <span className="muted">{pct(h.weight)} of the portfolio</span>
        </summary>
        <p>{narrative}</p>
        {metrics.length > 0 && <Figures items={metrics.map(([k, v]) => [metricLabel(k), metricValue(k, v)])} />}
      </details>
    </section>
  );
}

export function RiskFlags({ narrative, portfolio }: ReportComponentProps<'RiskFlags'>) {
  const flagged = portfolio.holdings.flatMap((h) => h.flags.map((f) => ({ name: h.name, flag: f })));
  if (flagged.length === 0) return null;
  return (
    <section className="rp-sec">
      <h3>Worth a second look</h3>
      <p>{narrative}</p>
      <Rest items={flagged} limit={3} label="flags" render={(x) => (
        <p key={`${x.name}-${x.flag}`} className="rp-flagrow">
          <b>{x.name}</b> {x.flag}
        </p>
      )} />
    </section>
  );
}
