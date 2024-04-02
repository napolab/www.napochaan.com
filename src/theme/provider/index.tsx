"use client";
import { ThemeProvider as NextThemeProvider } from "next-themes";

import * as styles from "./styles.css";

import type { Theme } from "@theme";
import type { FC, PropsWithChildren } from "react";

import "@theme/global.css";
import "@acab/reset.css";

/**
 * @package
 */
export type ThemeProviderProps = {
  defaultTheme?: Theme;
  theme?: Theme;
};

/**
 * @package
 */
export const ThemeProvider: FC<PropsWithChildren<ThemeProviderProps>> = ({ defaultTheme, theme, children }) => {
  return (
    <NextThemeProvider attribute="class" defaultTheme={defaultTheme} forcedTheme={theme}>
      <div className={styles.providerRoot}>{children}</div>
    </NextThemeProvider>
  );
};
