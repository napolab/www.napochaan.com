import { isProductionHost } from '@utils/is-production-host';
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
  const isProduction = isProductionHost(origin);

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
    // `wf-loading boot` is rendered into the SSR class (not added by JS) so the
    // boot overlay covers the page from the very first paint — even on a cached
    // load where the browser paints before the inline script runs. The script
    // only REMOVES boot (after fonts + floor for humans, immediately for bots).
    // This is UA-independent so the markup stays ISR/statically cacheable; the
    // bot exemption is done client-side in the script before first paint.
    // suppressHydrationWarning: the inline loader mutates documentElement.className
    // before React hydrates, so the live <html> class legitimately differs from
    // this render. Scoped to <html>'s own attributes only.
    <html lang="ja" className={`${fontVariables} wf-loading boot`} suppressHydrationWarning>
      <head>
        {/* Adobe Fonts (Typekit) async loader — non-blocking. Removes the SSR boot
            class once fonts resolve (or immediately for bots). No dynamic content. */}
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
