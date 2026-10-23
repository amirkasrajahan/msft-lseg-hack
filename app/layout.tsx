import type { ReactNode } from 'react';
import { Plus_Jakarta_Sans, Source_Serif_4 } from 'next/font/google';
import { SiteFooter, SiteNav } from '@/components/SiteNav';
import './globals.css';

const sans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const serif = Source_Serif_4({ subsets: ['latin'], variable: '--font-serif', display: 'swap' });

export const metadata = {
  title: 'Ethos | Invest with purpose',
  description: 'Ethos is an AI adviser for ethical charities and institutions. Invest with purpose, grow with confidence.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <SiteNav />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
