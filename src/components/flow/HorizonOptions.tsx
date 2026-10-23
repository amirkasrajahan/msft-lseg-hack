'use client';

import { useEffect, useState } from 'react';
import type { Portfolio } from '@/lib/schemas';
import styles from './HorizonOptions.module.css';

/**
 * Three portfolios for one client, side by side.
 *
 * The same money and the same ethical screening, with only the investment
 * horizon changing. The middle option is marked as the recommendation and the
 * other two keep the same contrast, so the client weighs them rather than
 * accepting a single answer on trust.
 */

type Horizon = { riskLevel: number; id: string; label: string; horizon: string };
type Option = { horizon: Horizon; portfolio: Portfolio };
type Data = { investmentAmount: number; options: Option[] };

const pct = (x: number | undefined) => `${((x ?? 0) * 100).toFixed(1)}%`;
const money = (x: number) => `£${Math.round(x).toLocaleString('en-GB')}`;

export function HorizonOptions({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`/api/session/${sessionId}/options`, { method: 'POST' })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? `HTTP ${r.status}`);
        if (live) setData(body);
      })
      .catch((e: unknown) => live && setError(e instanceof Error ? e.message : 'Something went wrong'));
    return () => {
      live = false;
    };
  }, [sessionId]);

  // The report stands on its own, so a failure here is reported quietly rather
  // than taking the page down.
  if (error) return <p className="muted">Could not work out the horizon options: {error}</p>;
  if (!data) return <p className="muted">Working out three portfolios…</p>;

  const recommended = Math.floor(data.options.length / 2);

  return (
    <section className={styles.wrap}>
      <h2 className={styles.heading}>If you needed this money sooner, or later</h2>
      <p className={styles.lede}>
        The same {money(data.investmentAmount)} and exactly the same ethical screening. Only the
        answer to “when will you need this money?” changes. Figures are estimates from past prices,
        not forecasts.
      </p>

      <div className={styles.grid}>
        {data.options.map((o, i) => {
          const s = o.portfolio.summary;
          const cash = o.portfolio.holdings.find((h) => h.ticker === 'CASH')?.weight ?? 0;
          const shares = o.portfolio.holdings.filter((h) => h.ticker !== 'CASH');
          return (
            <article
              key={o.horizon.id}
              className={`${styles.option} ${i === recommended ? styles.pick : ''}`}
            >
              {i === recommended && <span className={styles.flag}>Our recommendation</span>}
              <h3 className={styles.name}>{o.horizon.label}</h3>
              <p className={styles.when}>{o.horizon.horizon}</p>

              <dl className={styles.figures}>
                <div>
                  <dt>Expected return</dt>
                  <dd className={styles.lead}>{pct(s.expectedReturn)}</dd>
                </div>
                <div>
                  <dt>Volatility</dt>
                  <dd className={styles.lead}>{pct(s.volatility)}</dd>
                </div>
                <div>
                  <dt>Return per unit of risk</dt>
                  <dd>{(s.sharpe ?? 0).toFixed(2)}</dd>
                </div>
                <div>
                  <dt>Held as cash</dt>
                  <dd>{pct(cash)}</dd>
                </div>
                <div>
                  <dt>Companies held</dt>
                  <dd>{shares.length}</dd>
                </div>
              </dl>

              <h4 className={styles.subhead}>Largest holdings</h4>
              <ul className={styles.lines}>
                {o.portfolio.holdings.slice(0, 6).map((h) => (
                  <li key={h.ticker}>
                    <span className={styles.code}>{h.ticker}</span>
                    <span className={styles.label}>{h.name}</span>
                    <span className={styles.amount}>
                      {money(h.weight * data.investmentAmount)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className={styles.notes}>{s.methodology}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
