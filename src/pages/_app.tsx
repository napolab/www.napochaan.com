/* eslint-disable react/jsx-no-bind */
// eslint-disable-next-line camelcase
import { Noto_Sans_JP } from "next/font/google";
import { memo, Suspense, useState } from "react";

import Switch from "@components/switch";
import { HeadingLevelProvider } from "@hooks/heading-level";
import { ThemeProvider, useWatchSystemTheme } from "@theme";

import type { Theme } from "@theme";
import type { AppProps } from "next/app";
import type { FC } from "react";


const font = Noto_Sans_JP({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
});

const App: FC<AppProps> = ({ Component, pageProps }) => {
  const systemTheme = useWatchSystemTheme();
  const [theme, setTheme] = useState<Theme>();
  const currentTheme = theme ?? systemTheme;

  return (
    <div style={font.style}>
      <ThemeProvider theme={currentTheme}>
        <HeadingLevelProvider>
          <header>
            <Switch aria-label="toggle website theme" checked={currentTheme === "dark"} onChange={(isSelected) => setTheme(isSelected ? "dark" : "light")} />
          </header>

          <main>
            <Suspense>
              <Component {...pageProps} />
            </Suspense>
          </main>

          <footer></footer>
        </HeadingLevelProvider>
      </ThemeProvider>
    </div>
  );
};

export default memo(App);
