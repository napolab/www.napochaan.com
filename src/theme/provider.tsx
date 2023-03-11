import { SSRProvider } from "react-aria";

import { useIsomorphicLayoutEffect } from "@hooks/isomorphic-effect";

import * as styles from "./provider.css";

import type { FC, PropsWithChildren } from "react";

import "./config/base.css";
import "./config/dark.css";
import "./config/light.css";

/**
 * @package
 */
export type Theme = "dark" | "light";

/**
 * @package
 */
export type ThemeProviderProps = {
  theme?: Theme;
};

/**
 * @package
 */
export const ThemeProvider: FC<PropsWithChildren<ThemeProviderProps>> = ({ theme, children }) => {
  useIsomorphicLayoutEffect(() => {
      const el = document.querySelector("html");
      if(!theme) return;

      el?.classList.add(theme);

      return () => {
        el?.classList.remove(theme);
      };
  }, [theme]);

  return (
    <SSRProvider>
      <div className={styles.providerRoot}>{children}</div>
    </SSRProvider>
  );
};
