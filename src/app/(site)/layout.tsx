import { motionBootScriptHtml } from '@utils/motion-cookie';
import { getRequestOrigin } from '@utils/request-url';
import { fontVariables } from '@themes/fonts';
import { ThemeProvider } from '@themes/provider';
import { typekitLoaderHtml } from '@themes/typekit';
import { BootStatusProvider } from '@components/boot-status';
import { LoadingOverlay } from '@components/loading-overlay';
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
    // suppressHydrationWarning: the inline Typekit loader in <head> mutates
    // documentElement.className (adds wf-loading) before React hydrates, so the
    // live <html> class legitimately differs from this render. Scoped to <html>'s
    // own attributes only — child mismatches are still reported.
    <html lang="ja" className={fontVariables} suppressHydrationWarning>
      <head>
        {/* Adobe Fonts (Typekit) async loader — non-blocking; adds wf-loading
            class hook on <html>. Static vendor snippet, no dynamic content. */}
        <script dangerouslySetInnerHTML={typekitLoaderHtml} />
        {/* Pre-hydration: set --motion-play from the motion cookie before paint to
            avoid a flash of motion for motion:off visitors. See @utils/motion-cookie. */}
        <script dangerouslySetInnerHTML={motionBootScriptHtml} />
      </head>
      <ThemeProvider asChild>
        <body>
          <BootStatusProvider>
            <LoadingOverlay />
            <SiteShell>{children}</SiteShell>
          </BootStatusProvider>
        </body>
      </ThemeProvider>
    </html>
  );
};

export default SiteLayout;
