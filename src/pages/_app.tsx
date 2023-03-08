// eslint-disable-next-line camelcase
import { Noto_Sans_JP } from "next/font/google";
import { memo, Suspense, useCallback, useState } from "react";

import Switch from "@components/switch";
import { HeadingLevelProvider } from "@hooks/heading-level";
import { ThemeProvider } from "@theme";

import type { Theme } from "@theme";
import type { AppProps } from "next/app";
import type { FC } from "react";

const font = Noto_Sans_JP({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
});


const App: FC<AppProps> = ({ Component, pageProps }) => {
  const [theme, setTheme] = useState<Theme>("dark");
  const handleChangeTheme = useCallback((isSelected: boolean) => {
    const next: Theme = isSelected ? "dark" : "light";
    setTheme(next);
  }, []);

  return (
    <div style={font.style}>
      <ThemeProvider theme={theme}>
        <HeadingLevelProvider>
          <header>
            <Switch aria-label="toggle website theme" checked={theme === "dark"} onChange={handleChangeTheme} />
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
