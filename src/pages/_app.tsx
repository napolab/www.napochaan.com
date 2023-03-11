import { Provider, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
// eslint-disable-next-line camelcase
import { Noto_Sans_JP } from "next/font/google";
import Head from "next/head";
import { memo, Suspense, useCallback } from "react";

import PageTitle from "@components/page-title";
import Switch from "@components/switch";
import { HeadingLevelProvider } from "@hooks/heading-level";
import { ThemeProvider } from "@theme";

import * as styles from "./layout.css";

import type { Theme } from "@theme";
import type { AppProps } from "next/app";
import type { FC, PropsWithChildren } from "react";

const font = Noto_Sans_JP({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--noto-sans-jp",
});

const App: FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <>
      <Head>
        <PageTitle />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className={font.variable}>
        <Provider>
          <Layout>
            <Suspense>
              <Component {...pageProps} />
            </Suspense>
          </Layout>
        </Provider>
      </div>
    </>
  );
};

export default memo(App);

const themeAtom = atomWithStorage<Theme | undefined>("theme", undefined);

const Layout: FC<PropsWithChildren> = ({ children }) => {
  const [theme, setTheme] = useAtom(themeAtom);
  const handleChangeTheme = useCallback(
    (isSelected: boolean) => {
      const next: Theme = isSelected ? "dark" : "light";
      setTheme(next);
    },
    [setTheme],
  );

  return (
    <ThemeProvider theme={theme}>
      <HeadingLevelProvider>
        <header>
          <Switch aria-label="toggle website theme" checked={theme === "dark"} onChange={handleChangeTheme} />
        </header>

        <main className={styles.container}>{children}</main>

        <footer></footer>
      </HeadingLevelProvider>
    </ThemeProvider>
  );
};
