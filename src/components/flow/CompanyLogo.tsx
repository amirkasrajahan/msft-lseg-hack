'use client';

import { useState } from 'react';

const TOKEN = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;
/** Appended to the ticker for logo.dev, e.g. '.L' if it expects exchange-qualified symbols. Empty by default. */
const SUFFIX = process.env.NEXT_PUBLIC_LOGO_DEV_TICKER_SUFFIX ?? '';

/**
 * Company logo from logo.dev, looked up by ticker. Falls back to a coloured initials badge when there is no
 * token, no logo for the company, or the request fails. Needs NEXT_PUBLIC_LOGO_DEV_TOKEN (a publishable key).
 * ponytail: tickers are London symbols and logo.dev matches symbols globally, so check the logos that appear.
 * A `domain` field on Company would be a safer key.
 */
export function CompanyLogo({ ticker, name }: { ticker: string; name?: string }) {
  const [state, setState] = useState<'idle' | 'loaded' | 'failed'>('idle');
  const words = (name ?? ticker).split(/\s+/).filter(Boolean);
  const initials = (words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2)).toUpperCase();
  let hash = 0;
  for (const ch of ticker) hash = (hash * 31 + ch.charCodeAt(0)) % 360;

  const src = TOKEN
    ? `https://img.logo.dev/ticker/${encodeURIComponent(ticker + SUFFIX)}?token=${TOKEN}&size=64&format=png&fallback=404`
    : null;

  // The initials badge is always drawn first; a real logo fades in over it only once it has loaded.
  return (
    <span className={`logo${state === 'loaded' ? ' has-img' : ''}`} style={state === 'loaded' ? undefined : { background: `hsl(${hash} 45% 38%)` }} aria-hidden="true">
      {state !== 'loaded' && initials}
      {src && state !== 'failed' && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" decoding="async" className={state === 'loaded' ? 'show' : ''} onLoad={() => setState('loaded')} onError={() => setState('failed')} />
      )}
    </span>
  );
}
