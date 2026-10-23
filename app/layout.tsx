import type { ReactNode } from 'react';
import { SiteFooter, SiteNav } from '@/components/SiteNav';
import './globals.css';

export const metadata = {
  title: 'Ethos | Invest with purpose',
  description: 'Ethos is an AI adviser for ethical charities and institutions. Invest with purpose, grow with confidence.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteNav />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
