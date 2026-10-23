'use client';

import { useState } from 'react';
import type { ScreenApproval, ScreenResult } from '@/lib/schemas';

/**
 * Checkpoint 1. A ticker chip flips between kept and excluded; the diff against the server's
 * buckets is what we send back as ScreenApproval.
 * ponytail: tickers only, the screen result carries no company names. Ask orchestration to expose them.
 */
export function ScreenStep({
  screen,
  onApprove,
}: {
  screen: ScreenResult;
  onApprove: (a: ScreenApproval) => void;
}) {
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const [sent, setSent] = useState(false);

  const isKept = (ticker: string, action: 'keep' | 'exclude') =>
    (action === 'keep') !== flipped.has(ticker);

  const flip = (ticker: string) =>
    setFlipped((prev) => {
      const next = new Set(prev);
      if (!next.delete(ticker)) next.add(ticker);
      return next;
    });

  const keptCount = screen.buckets.reduce(
    (n, b) => n + b.tickers.filter((t) => isKept(t, b.action)).length,
    0,
  );

  const approve = () => {
    setSent(true);
    onApprove({
      forceKeep: screen.buckets.filter((b) => b.action === 'exclude').flatMap((b) => b.tickers.filter((t) => flipped.has(t))),
      forceExclude: screen.buckets.filter((b) => b.action === 'keep').flatMap((b) => b.tickers.filter((t) => flipped.has(t))),
    });
  };

  return (
    <section>
      <h2>Step 1: check the first screen</h2>
      <p>{screen.summary}</p>
      <p className="muted">Click a company to move it in or out. Crossed-out companies won&apos;t be considered.</p>

      {screen.buckets.map((b) => (
        <div key={b.id} className="card">
          <div className="head" style={{ display: 'flex', gap: '.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0 }}>{b.label}</h3>
            <span className={`badge ${b.action}`}>{b.action === 'keep' ? 'Continues' : 'Excluded'}</span>
          </div>
          <p className="muted">{b.rationale}</p>
          <div className="chips">
            {b.tickers.map((t) => (
              <button
                key={t}
                className="chip"
                aria-pressed={isKept(t, b.action)}
                onClick={() => flip(t)}
                disabled={sent}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="actions">
        <button className="btn" onClick={approve} disabled={sent || keptCount === 0}>
          Approve and check ethics ({keptCount} {keptCount === 1 ? 'company' : 'companies'})
        </button>
        {keptCount === 0 && <small>Keep at least one company to continue.</small>}
      </div>
    </section>
  );
}
