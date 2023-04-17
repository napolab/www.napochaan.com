import { Noto_Sans_JP, Poppins } from "next/font/google";
import React, { memo, Suspense } from "react";

import PageHead from "@components/page-head";
import { HeadingLevelProvider } from "@hooks/heading-level";
import { ThemeProvider } from "@theme";
import { clsx } from "@utils/clsx";
import reportAccessibility from "@utils/report-accessibility";

import * as styles from "./layout.css";

import type { AppProps } from "next/app";
import type { FC, PropsWithChildren } from "react";

import "@acab/reset.css";

const notoSansJP = Noto_Sans_JP({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--noto-sans-jp",
});
const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--poppins",
});

const fonts = clsx(notoSansJP.className, notoSansJP.variable, poppins.className, poppins.variable);
const App: FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <>
      <PageHead>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </PageHead>

      <div className={fonts}>
        <Layout>
          <Suspense>
            <Component {...pageProps} />
          </Suspense>
        </Layout>
      </div>
    </>
  );
};

void reportAccessibility(React);
export default memo(App);

const Layout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <ThemeProvider defaultTheme="dark">
      <HeadingLevelProvider>
        <main className={styles.mainRoot}>{children}</main>
      </HeadingLevelProvider>
      <footer className={styles.footerRoot}>© 2023 naporitan</footer>
    </ThemeProvider>
  );
};