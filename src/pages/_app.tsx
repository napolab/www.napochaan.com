import { Provider } from "jotai";
import { atomWithStorage } from "jotai/utils";
import React, { memo, Suspense } from "react";

import PageHead from "@components/page-head";
import { HeadingLevelProvider } from "@hooks/heading-level";
import { ThemeProvider } from "@theme";
import reportAccessibility from "@utils/report-accessibility";

import * as styles from "./layout.css";

import type { Theme } from "@theme";
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
