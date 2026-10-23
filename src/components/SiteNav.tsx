'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { EthosMark } from './flow/EthosMark';

const LINKS = [
  { href: '/', label: 'Home', anchor: false },
  { href: '/#how', label: 'How it works', anchor: true },
  { href: '/#built-for', label: "Who it's for", anchor: true },
  { href: '/about', label: 'About', anchor: false },
];

/** Sticky site navigation, shared by every page. Solid navy over the landing page, light elsewhere. */
export function SiteNav() {
  const path = usePathname();
  const dark = path === '/';
  return (
    <header className={`sitenav${dark ? ' dark' : ''}`}>
      <div className="sitenav-inner">
        <Link href="/" className="nav-brand" aria-label="Ethos home">
          <EthosMark size={34} boxed={!dark} />
          <span>Ethos</span>
        </Link>
        <nav aria-label="Main">
          {LINKS.map(({ href, label, anchor }) => {
            const active = !anchor && path === href;
            return (
              <Link
                key={href}
                href={href}
                className={`nav-link${anchor ? ' anchor' : ''}${active ? ' active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="nav-cta">
          {!path.startsWith('/app') && (
            <Link href="/app?start=chat" className={`btn small${dark ? ' light' : ''}`}>
              Get started
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

/** Shared footer. The landing page draws its own. */
export function SiteFooter() {
  const path = usePathname();
  if (path === '/') return null;
  return (
    <footer className="foot">
      <b>Ethos</b> · Invest with purpose. Grow with confidence.
      <br />
      An educational hackathon prototype. Ethical assessments use a growing evidence base and portfolio weights are a
      placeholder. Not financial advice.
    </footer>
  );
}
