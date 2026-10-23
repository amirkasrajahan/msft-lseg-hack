import type { Company, ScreenApproval, ScreenResult, VetConfirmation, VetResult } from '@/lib/schemas';

type Props = {
  screen: ScreenResult;
  screenApproval?: ScreenApproval;
  vet: VetResult;
  vetConfirmation?: VetConfirmation;
  held: number;
  companies: Record<string, Company>;
};

const name = (companies: Record<string, Company>, t: string) => companies[t]?.name ?? t;

/** The funnel from the full list down to the portfolio, plus every call the client overruled. Real session data only. */
export function DecisionTrail({ screen, screenApproval, vet, vetConfirmation, held, companies }: Props) {
  const total = screen.buckets.reduce((n, b) => n + b.tickers.length, 0);
  const kept = new Set(screen.buckets.filter((b) => b.action === 'keep').flatMap((b) => b.tickers));
  screenApproval?.forceKeep.forEach((t) => kept.add(t));
  screenApproval?.forceExclude.forEach((t) => kept.delete(t));
  const passedEthics =
    vet.passed.length + vet.borderline.length - (vetConfirmation?.forceExclude.length ?? 0) + (vetConfirmation?.forceInclude.length ?? 0);

  const stages = [
    ['Companies considered', total],
    ['Passed your rules', kept.size],
    ['Passed the ethics check', passedEthics],
    ['In your portfolio', held],
  ] as const;

  const overrides = [
    ...(screenApproval?.forceKeep ?? []).map((t) => `You kept ${name(companies, t)} although the screen excluded it.`),
    ...(screenApproval?.forceExclude ?? []).map((t) => `You removed ${name(companies, t)} although the screen kept it.`),
    ...(vetConfirmation?.forceExclude ?? []).map((t) => `You excluded ${name(companies, t)} after the ethics check.`),
    ...(vetConfirmation?.forceInclude ?? []).map((t) => `You included ${name(companies, t)} although it failed the ethics check.`),
  ];

  return (
    <div className="card">
      <h3>How we got here</h3>
      <div className="bars">
        {stages.map(([label, n]) => (
          <div key={label} className="bar-row">
            <span>{label}</span>
            <div className="track">
              <div className="fill" style={{ width: `${total ? (n / total) * 100 : 0}%` }} />
            </div>
            <b>{n}</b>
          </div>
        ))}
      </div>
      <h3 style={{ marginTop: '1rem' }}>Your calls</h3>
      {overrides.length === 0 ? (
        <p className="muted" style={{ margin: 0 }}>You accepted the recommendation at both checkpoints.</p>
      ) : (
        <ul className="plain">
          {overrides.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
