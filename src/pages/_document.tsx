import { Html, Head, Main, NextScript } from "next/document";

import type { DocumentProps } from "next/document";
import type { FC } from "react";

const description = "ReactとTypeScriptのオタクだったりオタクじゃなかったりします。";

const Document: FC<DocumentProps> = () => {
  return (
    <Html lang="ja">
      <Head>
        <meta charSet="utf-8" />
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#ffffff" />

        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" crossOrigin="use-credentials" />

        <meta
          name="keywords"
          content="naporitan,engineer,web,application,react,typescript,frontend,statemanagement,javascript,python,ruby,swift,haskell"
        />
        <meta name="author" content="naporitan" />
        <meta name="description" content={description} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content="naporitan official website" />
        <meta property="og:url" content="https://napochaan.com/" />
        <meta
          property="og:image"
          content="https://imagedelivery.net/TQ7GECK3x8OMl8rY8WdOxQ/46fbeda6-e4fe-4519-defc-d04bb7af4200/ogp"
        />
        <meta property="og:description" content={description} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="@naporin24690 official website" />
        <meta
          name="twitter:image"
          content="https://imagedelivery.net/TQ7GECK3x8OMl8rY8WdOxQ/46fbeda6-e4fe-4519-defc-d04bb7af4200/ogp"
        />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:site" content="@naporin24690" />
        <meta name="twitter:creator" content="@naporin24690" />
      </Head>

      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
};

export default Document;
