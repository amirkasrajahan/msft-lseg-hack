import { causeById, type Holding } from '@/lib/schemas';
import { RISK_LABELS, humanize } from '@/components/flow/ProfileSummary';
import type { ReportComponentProps } from './registry';

const pct = (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`;
const colour = (i: number) => `var(--c${(i % 8) + 1})`;

/** Free-form metric keys are camelCase; yields and returns arrive as fractions. */
const metricLabel = (k: string) =>
  k === 'pe' ? 'P/E ratio' : humanize(k.replace(/([A-Z])/g, ' $1').toLowerCase());
const metricValue = (k: string, v: number) =>
  /yield|return|volatility|margin|growth/i.test(k) ? pct(v) : String(Number(v.toFixed(2)));

const byWeight = (holdings: Holding[]) => [...holdings].sort((a, b) => b.weight - a.weight);

export function ExecutiveSummary({ headline, narrative, portfolio }: ReportComponentProps<'ExecutiveSummary'>) {
  const { expectedReturn, volatility, sharpe } = portfolio.summary;
  return (
    <div className="card soft">
      <h2>{headline}</h2>
      <p>{narrative}</p>
      <div className="kpis">
        <div className="kpi"><b>{portfolio.holdings.length}</b><span>Holdings</span></div>
        {expectedReturn !== undefined && <div className="kpi"><b>{pct(expectedReturn)}</b><span>Expected return a year</span></div>}
        {volatility !== undefined && <div className="kpi"><b>{pct(volatility)}</b><span>Volatility (ups and downs)</span></div>}
        {sharpe !== undefined && <div className="kpi"><b>{sharpe.toFixed(2)}</b><span>Return per unit of risk</span></div>}
      </div>
      <p className="muted" style={{ marginTop: '.75rem', marginBottom: 0 }}>{portfolio.summary.methodology}</p>
    </div>
  );
}

export function RiskProfileCard({ narrative, profile }: ReportComponentProps<'RiskProfileCard'>) {
  return (
    <div className="card">
      <h3>Your risk profile</h3>
      <p>
        <span className="dots" role="img" aria-label={`Risk ${profile.riskLevel} of 5`}>
          {[1, 2, 3, 4, 5].map((n) => <i key={n} className={n <= profile.riskLevel ? 'on' : ''} />)}
        </span>{' '}
        <b>{RISK_LABELS[profile.riskLevel - 1]}</b> <span className="muted">({profile.riskLevel} of 5)</span>
      </p>
      <p>{narrative}</p>
      <div className="chips">
        {profile.causes.map((c) => (
          <span key={c.causeId} className="chip good">
            {c.stance === 'seek' ? 'Backs' : 'Avoids harm in'} {causeById(c.causeId).label.toLowerCase()} · weight {c.weight}/5
          </span>
        ))}
      </div>
    </div>
  );
}

export function AllocationDonut({ title, portfolio }: ReportComponentProps<'AllocationDonut'>) {
  const R = 70;
  const C = 2 * Math.PI * R;
  const holdings = byWeight(portfolio.holdings);
  let offset = 0;
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="donut-wrap">
        <svg viewBox="0 0 200 200" role="img" aria-label="Portfolio weights by holding">
          <g transform="rotate(-90 100 100)">
            {holdings.map((h, i) => {
              const seg = (
                <circle
                  key={h.ticker}
                  className="seg"
                  style={{ animationDelay: `${i * 0.08}s` }}
                  cx="100" cy="100" r={R} fill="none" stroke={colour(i)} strokeWidth="32"
                  strokeDasharray={`${h.weight * C} ${C}`} strokeDashoffset={-offset * C}
                />
              );
              offset += h.weight;
              return seg;
            })}
          </g>
          <text x="100" y="96" textAnchor="middle" fontSize="22" fontWeight="700" fill="currentColor">{holdings.length}</text>
          <text x="100" y="116" textAnchor="middle" fontSize="12" fill="currentColor">holdings</text>
        </svg>
        <ul className="legend">
          {holdings.map((h, i) => (
            <li key={h.ticker}>
              <span className="sw" style={{ background: colour(i) }} />
              <span className="name">{h.name} <small>{h.ticker}</small></span>
              <b>{pct(h.weight)}</b>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function HoldingsTable({ title, showReasons, portfolio }: ReportComponentProps<'HoldingsTable'>) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="table-wrap">
        <table className="holdings">
          <thead>
            <tr>
              <th>Company</th><th>Sector</th><th>Weight</th>
              {showReasons && <><th>Financial case</th><th>Ethical case</th></>}
            </tr>
          </thead>
          <tbody>
            {byWeight(portfolio.holdings).map((h) => (
              <tr key={h.ticker}>
                <td><b>{h.name}</b><br /><small>{h.ticker}</small></td>
                <td>{h.sector}</td>
                <td className="num"><b>{pct(h.weight)}</b></td>
                {showReasons && (
                  <>
                    <td><ul>{h.financialReasons.map((r) => <li key={r}>{r}</li>)}</ul></td>
                    <td><ul>{h.ethicalReasons.map((r) => <li key={r}>{r}</li>)}</ul></td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SectorBreakdown({ title, portfolio }: ReportComponentProps<'SectorBreakdown'>) {
  const totals = new Map<string, number>();
  for (const h of portfolio.holdings) totals.set(h.sector, (totals.get(h.sector) ?? 0) + h.weight);
  const rows = [...totals].sort((a, b) => b[1] - a[1]);
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="bars">
        {rows.map(([sector, w]) => (
          <div key={sector} className="bar-row">
            <span>{sector}</span>
            <div className="track"><div className="fill" style={{ width: pct(w, 0) }} /></div>
            <b>{pct(w, 0)}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EthicalScreeningSummary({ narrative, vet }: ReportComponentProps<'EthicalScreeningSummary'>) {
  return (
    <div className="card">
      <h3>How we screened for ethics</h3>
      <p>{narrative}</p>
      <div className="kpis">
        <div className="kpi"><b>{vet.passed.length}</b><span>Passed cleanly</span></div>
        <div className="kpi"><b>{vet.borderline.length}</b><span>Accepted with concerns</span></div>
        <div className="kpi"><b>{vet.excluded.length}</b><span>Excluded</span></div>
      </div>
      {vet.excluded.map((d) => (
        <p key={d.ticker} style={{ margin: '.75rem 0 0' }}>
          <span className="chip bad"><b>{d.ticker}</b></span> <b>{causeById(d.causeId).label}:</b> {d.reason}
        </p>
      ))}
    </div>
  );
}

export function BorderlineDecisions({ narrative, vet, portfolio }: ReportComponentProps<'BorderlineDecisions'>) {
  return (
    <div className="card">
      <h3>Close calls</h3>
      <p>{narrative}</p>
      {vet.borderline.length === 0 ? (
        <p className="muted">No company needed a close call.</p>
      ) : (
        vet.borderline.map((d) => (
          <div key={d.ticker} className="flag">
            <b>{portfolio.holdings.find((h) => h.ticker === d.ticker)?.name ?? d.ticker}</b>{' '}
            <small>on {causeById(d.causeId).label.toLowerCase()}</small>
            <br />{d.reason}
          </div>
        ))
      )}
    </div>
  );
}

export function HoldingDeepDive({ ticker, narrative, portfolio }: ReportComponentProps<'HoldingDeepDive'>) {
  const h = portfolio.holdings.find((x) => x.ticker === ticker);
  if (!h) return null;
  const metrics = Object.entries(h.metrics);
  return (
    <div className="card">
      <h3>{h.name} <small>{h.ticker} · {h.sector} · {pct(h.weight)} of the portfolio</small></h3>
      <p>{narrative}</p>
      <div className="grid2">
        <div><b>Financial case</b><ul className="plain">{h.financialReasons.map((r) => <li key={r}>{r}</li>)}</ul></div>
        <div><b>Ethical case</b><ul className="plain">{h.ethicalReasons.map((r) => <li key={r}>{r}</li>)}</ul></div>
      </div>
      {metrics.length > 0 && (
        <div className="kpis">
          {metrics.map(([k, v]) => <div key={k} className="kpi"><b>{metricValue(k, v)}</b><span>{metricLabel(k)}</span></div>)}
        </div>
      )}
    </div>
  );
}

export function RiskFlags({ narrative, portfolio }: ReportComponentProps<'RiskFlags'>) {
  const flagged = portfolio.holdings.filter((h) => h.flags.length > 0);
  return (
    <div className="card">
      <h3>Things to watch</h3>
      <p>{narrative}</p>
      {flagged.length === 0 ? (
        <p className="muted">No holding has been flagged.</p>
      ) : (
        flagged.flatMap((h) => h.flags.map((f) => (
          <div key={`${h.ticker}-${f}`} className="flag"><b>{h.name}</b> <small>{h.ticker}</small><br />{f}</div>
        )))
      )}
    </div>
  );
}
