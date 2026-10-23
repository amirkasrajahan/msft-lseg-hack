import type { Company } from '@/lib/schemas';
import { CompanyLogo } from './CompanyLogo';

/**
 * A company as a chip with a details card. The card shows on hover and on keyboard focus (so touch and
 * keyboard users get it too). Falls back to the ticker alone if the company list is not loaded.
 */
export function CompanyChip({
  ticker,
  company,
  tone,
  pressed,
  disabled,
  why,
  onClick,
}: {
  ticker: string;
  company?: Company;
  tone?: 'good' | 'warn' | 'bad';
  pressed?: boolean;
  disabled?: boolean;
  /** Client-facing reasons this company is in or out. Each entry is one line. */
  why?: string[];
  onClick?: () => void;
}) {
  return (
    <span className="chip-wrap">
      <button className={`chip ${tone ?? ''}`} aria-pressed={pressed} disabled={disabled} onClick={onClick}>
        <CompanyLogo ticker={ticker} name={company?.name} />
        <b>{ticker}</b>
        {company && <span className="chip-name">{company.name}</span>}
      </button>
      <span role="tooltip" className="tip">
        <span className="tip-head">
          <CompanyLogo ticker={ticker} name={company?.name} />
          <b>{company?.name ?? ticker}</b>
        </span>
        {company && (
          <small>
            {company.sector} · {company.industries.join(', ')}
            {company.marketCapGbpBn !== undefined && ` · £${company.marketCapGbpBn}bn`}
          </small>
        )}
        {company && <span>{company.description}</span>}
        {why?.map((line) => (
          <span key={line} className="why">
            {line}
          </span>
        ))}
      </span>
    </span>
  );
}
