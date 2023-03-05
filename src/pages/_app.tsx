/* eslint-disable react/jsx-no-bind */
// eslint-disable-next-line camelcase
import { Noto_Sans, Noto_Sans_JP } from "next/font/google";
import { memo, Suspense, useState } from "react";

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
  const currentTheme = theme ?? systemTheme;

  return (
    <div className={clsx(notosans.className, notosansjp.className)}>
      <ThemeProvider theme={currentTheme}>
        <header>
          <button onClick={() => setTheme("light")}>light</button>
          <button onClick={() => setTheme("dark")}>dark</button>
        </header>

        <main>
          <Suspense>
            <Component {...pageProps} />
          </Suspense>
        </main>

        <footer></footer>
      </ThemeProvider>
    </div>
  );
};

export default memo(App);
