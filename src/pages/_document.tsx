import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

import type { DocumentProps } from "next/document";
import type { FC } from "react";

const Document: FC<DocumentProps> = () => {
  return (
    <Html>
      <Head>
        <meta charSet="utf-8" />
        <meta property="og:image" content="https://www.napochaan.com/images/ogp.jpg" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="napochaan official webSite" />
        <meta name="color-scheme" content="light dark" />
        <link rel="stylesheet" href="https://unpkg.com/@acab/reset.css" />
        <Script src="/widget-theme.js" strategy="beforeInteractive" />
      </Head>

      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
};

export default Document;
