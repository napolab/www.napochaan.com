import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

import type { DocumentProps } from "next/document";
import type { FC } from "react";

const description =
  "こんにちは、 naporitan です。僕はアプリケーション開発や React, TypeScript を得意とし、新しい技術に触れたり、音楽を聴いたり、FPSをすることが好きです。特に TypeScript と Haskell がお気に入りの言語で、JavaScript, Python, Ruby, Swift, Haskellを触れています。";

const Document: FC<DocumentProps> = () => {
  return (
    <Html lang="ja">
      <Head>
        <meta charSet="utf-8" />
        <link rel="stylesheet" href="https://unpkg.com/@acab/reset.css" />
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#FCD799" />

        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />

        <meta
          name="keywords"
          content="naporitan,アプリケーション開発,React,TypeScript,フロントエンド,状態管理,JavaScript,Python,Ruby,Swift,Haskell"
        />
        <meta name="auhor" content="naporitan" />
        <meta name="description" content={description} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content="@naporin24690 official website" />
        <meta property="og:url" content="https://www.napochaan.com/" />
        <meta property="og:image" content="https://www.napochaan.com/images/ogp.jpg" />
        <meta property="og:description" content={description} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="@naporin24690 official website" />
        <meta name="twitter:image" content="https://www.napochaan.com/ogp.png" />
        <meta name="twitter:description" content={"React と TypeScript のオタクだったりオタクじゃなかったりします。"} />
        <meta name="twitter:site" content="@naporin24690" />
        <meta name="twitter:creator" content="@naporin24690" />

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
