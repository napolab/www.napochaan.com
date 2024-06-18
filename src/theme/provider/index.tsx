"use client";
import { ThemeProvider as NextThemeProvider, useTheme } from "next-themes";

import { dark } from "@theme/config/dark.css";
import { light } from "@theme/config/light.css";

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

export const usePalette = () => {
  const { theme } = useTheme();

  return theme === "dark" ? dark : light;
};
