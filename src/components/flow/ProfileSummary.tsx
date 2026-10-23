import { causeById, type ClientProfile } from '@/lib/schemas';

export const RISK_LABELS = ['Very cautious', 'Cautious', 'Balanced', 'Growth', 'Very aggressive'];

export const humanize = (s: string) => s.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

export function ProfileSummary({ profile }: { profile: ClientProfile }) {
  return (
    <div className="card soft">
      <h3>Your client</h3>
      <p style={{ marginBottom: '.5rem' }}>
        <b>
          Risk {profile.riskLevel} of 5, {RISK_LABELS[profile.riskLevel - 1].toLowerCase()}
        </b>
        {profile.notes && <span className="muted"> · {profile.notes}</span>}
      </p>
      <div className="chips">
        {profile.activityExclusions.map((a) => (
          <span key={a} className="chip bad">
            No {humanize(a).toLowerCase()}
          </span>
        ))}
        {profile.sectors.exclude.map((s) => (
          <span key={s} className="chip bad">
            No {s}
          </span>
        ))}
        {profile.causes.map((c) => (
          <span key={c.causeId} className="chip good" title={c.userWords}>
            {c.stance === 'seek' ? 'Backs' : 'Avoids harm in'} {causeById(c.causeId).label.toLowerCase()}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Plain-text version of the profile, used to start an edit conversation. */
export function profileToText(profile: ClientProfile): string {
  const lines = [`Risk ${profile.riskLevel} of 5 (${RISK_LABELS[profile.riskLevel - 1].toLowerCase()})`];
  if (profile.activityExclusions.length) lines.push(`Refuses: ${profile.activityExclusions.map((a) => humanize(a).toLowerCase()).join(', ')}`);
  if (profile.sectors.exclude.length) lines.push(`Avoids sectors: ${profile.sectors.exclude.join(', ')}`);
  if (profile.sectors.include.length) lines.push(`Prefers sectors: ${profile.sectors.include.join(', ')}`);
  for (const c of profile.causes) {
    lines.push(`${causeById(c.causeId).label}: ${c.stance === 'seek' ? 'actively back' : 'avoid serious offenders'}, weight ${c.weight}/5`);
  }
  if (profile.notes) lines.push(`Notes: ${profile.notes}`);
  return lines.map((l) => `• ${l}`).join('\n');
}
