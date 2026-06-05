import { getRequestOrigin } from '@utils/request-url';
import { fontVariables } from '@themes/fonts';
import { ThemeProvider } from '@themes/provider';
import { SiteShell } from '@components/site-shell';

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

const siteName = 'napochaan';
const description = 'napochaan の個人サイト。';

export const viewport: Viewport = {
  viewportFit: 'cover',
  initialScale: 1,
  width: 'device-width',
  themeColor: 'oklch(0.490 0.287 266)',
};

export const generateMetadata = async (): Promise<Metadata> => {
  const origin = await getRequestOrigin();
  const isProduction = origin === 'https://www.napochaan.com';

  return {
    title: {
      default: siteName,
      template: `%s — ${siteName}`,
    },
    description,
    metadataBase: new URL(origin),
    alternates: {
      canonical: '/',
    },
    robots: isProduction ? undefined : { index: false, follow: false },
    openGraph: {
      type: 'website',
      siteName,
      title: siteName,
      description,
      url: origin,
      locale: 'ja_JP',
    },
    twitter: {
      card: 'summary_large_image',
      title: siteName,
      description,
    },
  };
};

const SiteLayout = async ({ children }: { children: ReactNode }) => {
  return (
    <html lang="ja" className={fontVariables}>
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/izz7men.css" />
      </head>
      <ThemeProvider asChild>
        <body>
          <SiteShell>{children}</SiteShell>
        </body>
      </ThemeProvider>
    </html>
  );
};

export default SiteLayout;
