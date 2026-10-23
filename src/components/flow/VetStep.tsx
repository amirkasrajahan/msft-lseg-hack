'use client';

import { useState } from 'react';
import { causeById, type VetConfirmation, type VetDecision, type VetResult } from '@/lib/schemas';

/** Checkpoint 2. Borderline companies are in by default and can be removed; excluded ones can be brought back. */
export function VetStep({
  vet,
  onConfirm,
}: {
  vet: VetResult;
  onConfirm: (c: VetConfirmation) => void;
}) {
  const [out, setOut] = useState<Set<string>>(new Set()); // passed or borderline tickers the client removed
  const [back, setBack] = useState<Set<string>>(new Set()); // excluded tickers the client brought back
  const [sent, setSent] = useState(false);

  const toggle = (set: Set<string>, ticker: string, update: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (!next.delete(ticker)) next.add(ticker);
    update(next);
  };

  const total =
    vet.passed.filter((t) => !out.has(t)).length +
    vet.borderline.filter((d) => !out.has(d.ticker)).length +
    back.size;

  return (
    <section>
      <h2>Step 2: confirm the ethics check</h2>
      <p>{vet.summary}</p>

      <div className="card">
        <h3>Passed cleanly ({vet.passed.length})</h3>
        <p className="muted">No serious concerns on your causes. Click one to leave it out.</p>
        <div className="chips">
          {vet.passed.map((t) => (
            <button
              key={t}
              className="chip good"
              aria-pressed={!out.has(t)}
              disabled={sent}
              onClick={() => toggle(out, t, setOut)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {vet.borderline.length > 0 && (
        <div className="card">
          <h3>Accepted with concerns ({vet.borderline.length})</h3>
          <p className="muted">Close calls. They are in the portfolio unless you remove them.</p>
          {vet.borderline.map((d) => (
            <Decision
              key={d.ticker}
              d={d}
              tone="warn"
              pressed={!out.has(d.ticker)}
              label={out.has(d.ticker) ? 'Removed' : 'Keep in portfolio'}
              disabled={sent}
              onToggle={() => toggle(out, d.ticker, setOut)}
            />
          ))}
        </div>
      )}

      {vet.excluded.length > 0 && (
        <div className="card">
          <h3>Excluded ({vet.excluded.length})</h3>
          <p className="muted">These failed the check on your causes. You can overrule that.</p>
          {vet.excluded.map((d) => (
            <Decision
              key={d.ticker}
              d={d}
              tone="bad"
              pressed={back.has(d.ticker)}
              label={back.has(d.ticker) ? 'Included anyway' : 'Include anyway'}
              disabled={sent}
              onToggle={() => toggle(back, d.ticker, setBack)}
            />
          ))}
        </div>
      )}

      <div className="actions">
        <button
          className="btn"
          disabled={sent || total === 0}
          onClick={() => {
            setSent(true);
            onConfirm({ forceInclude: [...back], forceExclude: [...out] });
          }}
        >
          Confirm and build portfolio ({total} {total === 1 ? 'company' : 'companies'})
        </button>
        {total === 0 && <small>Keep at least one company to continue.</small>}
      </div>
    </section>
  );
}

function Decision({
  d,
  tone,
  pressed,
  label,
  disabled,
  onToggle,
}: {
  d: VetDecision;
  tone: 'warn' | 'bad';
  pressed: boolean;
  label: string;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="decision">
      <div>
        <div className="head">
          <span className={`chip ${tone}`}>
            <b>{d.ticker}</b>
          </span>
          <span>{causeById(d.causeId).label}</span>
          <span className={`meter ${tone === 'bad' ? 'bad' : ''}`} title={`Concern score ${d.score}`}>
            <span style={{ width: `${Math.min(100, d.score)}%` }} />
          </span>
          <small>score {Math.round(d.score)}</small>
        </div>
        <p style={{ margin: 0 }}>{d.reason}</p>
      </div>
      <button className="toggle" aria-pressed={pressed} disabled={disabled} onClick={onToggle}>
        {label}
      </button>
    </div>
  );
}
