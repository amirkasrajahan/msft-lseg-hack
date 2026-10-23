/**
 * Initials badge standing in for a logo. Company data has no logo or domain field yet (and the demo
 * companies are fictional), so this is generated: same company, same colour, every time.
 * ponytail: swap for an <img> once Company gains a logo/domain field.
 */
export function CompanyLogo({ ticker, name }: { ticker: string; name?: string }) {
  const words = (name ?? ticker).split(/\s+/).filter(Boolean);
  const initials = (words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2)).toUpperCase();
  let hash = 0;
  for (const ch of ticker) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  return (
    <span className="logo" style={{ background: `hsl(${hash} 45% 38%)` }} aria-hidden="true">
      {initials}
    </span>
  );
}
