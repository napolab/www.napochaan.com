'use client';

import { Button } from '@components/button';
import { css } from '@styled/css';
import { fontVariables } from '@themes/fonts';
import { typekitLoaderHtml } from '@themes/typekit';

import { ErrorScreen } from './_components/error-screen';

import '@themes/global.css';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

// global-error replaces the root layout, so it renders its own document OUTSIDE
// ThemeProvider / SiteShell. Importing '@themes/global.css' brings the token CSS
// vars + canvas bg + grid + base typography (globalCss targets :root and
// html,body directly), so the full design-system world-view resolves here even
// without the provider. fontVariables + the Typekit async loader restore the
// display/mono faces; ErrorScreen is reused so 500-fatal matches the 404/500
// screens exactly rather than dropping to a bare fallback.
const bodyStyle = css({
  minHeight: '[100dvh]',
  paddingInline: 'page',
});

const GlobalError = ({ reset }: Props) => (
  <html lang="ja" className={fontVariables} suppressHydrationWarning>
    <head>
      {/* Static vendor snippet, no dynamic content — see @themes/typekit. */}
      <script dangerouslySetInnerHTML={typekitLoaderHtml} />
    </head>
    <body className={bodyStyle}>
      <ErrorScreen code="500" kind="fatal" lead="致命的なエラーが発生しました。再読み込みしてください。" tag="■ fatal">
        <Button variant="danger" onPress={reset}>
          reload
        </Button>
      </ErrorScreen>
    </body>
  </html>
);

export default GlobalError;
