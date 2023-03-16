import { Provider, useAtom } from "jotai";
import React, { memo, Suspense } from "react";

import { themeAtom } from "@atoms/theme";
import PageHead from "@components/page-head";
import { HeadingLevelProvider } from "@hooks/heading-level";
import { ThemeProvider } from "@theme";
import reportAccessibility from "@utils/report-accessibility";

import * as styles from "./layout.css";

import type { AppProps } from "next/app";
import type { FC, PropsWithChildren } from "react";

import "@acab/reset.css";

const App: FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <>
      <PageHead>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </PageHead>

      <Provider>
        <Layout>
          <Suspense>
            <Component {...pageProps} />
          </Suspense>
        </Layout>
      </Provider>
    </>
  );
};

void reportAccessibility(React);
export default memo(App);

const Layout: FC<PropsWithChildren> = ({ children }) => {
  const [theme] = useAtom(themeAtom);

  return (
    <ThemeProvider theme={theme}>
      <HeadingLevelProvider>
        <main className={styles.mainRoot}>{children}</main>

        <footer className={styles.footerRoot}>© 2023 naporitan</footer>
      </HeadingLevelProvider>
    </ThemeProvider>
  );
};
