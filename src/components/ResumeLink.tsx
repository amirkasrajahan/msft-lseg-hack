'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/** "Resume your session" link, shown only if this browser has a saved session. */
export function ResumeLink() {
  const [has, setHas] = useState(false);
  useEffect(() => {
    try {
      setHas(!!localStorage.getItem('eia-session-id'));
    } catch {
      // storage blocked: no resume link
    }
  }, []);
  return has ? (
    <Link href="/app" className="lp-resume">
      Resume your session →
    </Link>
  ) : null;
}
