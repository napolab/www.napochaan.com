import { ThemeProvider as NextThemeProvider } from "next-themes";

import * as styles from "./provider.css";

import type { Theme } from "@theme";
import type { FC, PropsWithChildren } from "react";

import "./config/base.css";
import "./config/dark.css";
import "./config/light.css";

/**
 * @package
 */
export type ThemeProviderProps = {
  theme?: Theme;
  defaultTheme?: Theme;
};

/**
 * @package
 */
export const ThemeProvider: FC<PropsWithChildren<ThemeProviderProps>> = ({ theme, defaultTheme, children }) => {
  return (
    <NextThemeProvider attribute="class" forcedTheme={theme} defaultTheme={defaultTheme}>
      <div className={styles.providerRoot}>{children}</div>
    </NextThemeProvider>
  );
};
