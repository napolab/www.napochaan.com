// eslint-disable-next-line camelcase
import { Noto_Sans, Noto_Sans_JP } from "next/font/google";
import { memo, Suspense, useCallback, useState } from "react";

import { ThemeProvider, useWatchSystemTheme } from "@theme";
import { clsx } from "@utils/clsx";

import type { Theme } from "@theme";
import type { AppProps } from "next/app";
import type { FC } from "react";

const notosans = Noto_Sans({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
});
const notosansjp = Noto_Sans_JP({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
});

const App: FC<AppProps> = ({ Component, pageProps }) => {
  const systemTheme = useWatchSystemTheme();
  const [theme, setTheme] = useState<Theme>();
  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }, []);

  return (
    <ThemeProvider theme={theme ?? systemTheme}>
      <header>
        <input type="checkbox" checked={(theme ?? systemTheme) === "light"} onChange={toggleTheme} />
      </header>

      <main className={clsx(notosans.className, notosansjp.className)}>
        <Suspense>
          <Component {...pageProps} />
        </Suspense>
      </main>

      <footer></footer>
    </ThemeProvider>
  );
};

export default memo(App);
