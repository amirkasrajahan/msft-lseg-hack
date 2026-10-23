import type { Company, ScreenApproval, ScreenResult, VetConfirmation, VetResult } from '@/lib/schemas';
import { ChipList } from './ChipList';

type Props = {
  screen: ScreenResult;
  screenApproval?: ScreenApproval;
  vet: VetResult;
  vetConfirmation?: VetConfirmation;
  /** Tickers actually in the portfolio. */
  held: string[];
  companies: Record<string, Company>;
};

/**
 * How the list of companies shrank to the portfolio: four numbers with what each stage removed, and every company
 * by name under the outcome it reached, folded away until asked for. Real session data only.
 */
export function DecisionTrail({ screen, screenApproval, vet, vetConfirmation, held, companies }: Props) {
  const all = screen.buckets.flatMap((b) => b.tickers);

  const kept = new Set(screen.buckets.filter((b) => b.action === 'keep').flatMap((b) => b.tickers));
  screenApproval?.forceKeep.forEach((t) => kept.add(t));
  screenApproval?.forceExclude.forEach((t) => kept.delete(t));

  const ethicsPass = new Set([...vet.passed, ...vet.borderline.map((d) => d.ticker), ...(vetConfirmation?.forceInclude ?? [])]);
  vetConfirmation?.forceExclude.forEach((t) => ethicsPass.delete(t));

  const inPortfolio = new Set(held);
  const passedEthics = [...kept].filter((t) => ethicsPass.has(t)).length;

  // Where each company ended up. A company is counted once, in the first outcome that applies.
  const unratedSet = new Set(vet.unrated);
  const byRules = all.filter((t) => !kept.has(t) && !inPortfolio.has(t));
  const byUnrated = all.filter((t) => kept.has(t) && unratedSet.has(t) && !ethicsPass.has(t) && !inPortfolio.has(t));
  const byEthics = all.filter((t) => kept.has(t) && !ethicsPass.has(t) && !unratedSet.has(t) && !inPortfolio.has(t));
  const left = all.filter((t) => !inPortfolio.has(t) && !byRules.includes(t) && !byEthics.includes(t) && !byUnrated.includes(t));

  // The client's own calls, shown as a tag on the company.
  const calls = new Map<string, string>();
  screenApproval?.forceKeep.forEach((t) => calls.set(t, 'you kept it'));
  screenApproval?.forceExclude.forEach((t) => calls.set(t, 'you removed it'));
  vetConfirmation?.forceExclude.forEach((t) => calls.set(t, 'you excluded it'));
  vetConfirmation?.forceInclude.forEach((t) => calls.set(t, 'you included it'));

  const steps = [
    { n: all.length, label: 'Companies considered', note: '' },
    { n: kept.size, label: 'Passed your rules', note: all.length > kept.size ? `${all.length - kept.size} removed` : '' },
    {
      n: passedEthics,
      label: 'Passed the ethics check',
      note: [kept.size - passedEthics - byUnrated.length > 0 && `${kept.size - passedEthics - byUnrated.length} removed`, byUnrated.length > 0 && `${byUnrated.length} not rated`].filter(Boolean).join(', '),
    },
    { n: held.length, label: 'In your portfolio', note: '' },
  ];

  const groups = [
    { key: 'in', title: 'In your portfolio', list: [...inPortfolio] },
    { key: 'rules', title: 'Removed by your rules', list: byRules },
    { key: 'ethics', title: 'Removed by the ethics check', list: byEthics },
    { key: 'unrated', title: 'Not rated: not enough evidence yet', list: byUnrated },
    { key: 'left', title: 'Passed but not chosen', list: left },
  ].filter((g) => g.list.length > 0);

  return (
    <section className="rp-sec">
      <h3>How we got here</h3>
      <ol className="rp-steps">
        {steps.map((s) => (
          <li key={s.label}>
            <b>{s.n}</b>
            <span>{s.label}</span>
            {s.note && <small>{s.note}</small>}
          </li>
        ))}
      </ol>
      {calls.size > 0 && <p className="muted rp-calls">Your own calls: {calls.size} {calls.size === 1 ? 'company' : 'companies'} moved. They are tagged below.</p>}
      <details className="rp-more">
        <summary>See what happened to every company</summary>
        {groups.map((g) => (
          <div key={g.key} className="rp-group">
            <h4>
              {g.title} <span>{g.list.length}</span>
            </h4>
            <ChipList
              items={g.list}
              limit={12}
              render={(t) => (
                <span key={t} className="rp-name-pill">
                  {companies[t]?.name ?? t}
                  {calls.has(t) && <em>{calls.get(t)}</em>}
                </span>
              )}
            />
          </div>
        ))}
        {calls.size === 0 && <p className="muted">You accepted the recommendation at both checkpoints.</p>}
      </details>
    </section>
  );
}
